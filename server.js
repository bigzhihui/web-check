import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';

import { shouldSkip } from './api/_common/check-skipper.js';
import { assertPublicTarget } from './api/_common/public-target.js';
import siteConfig from './site-config.json' with { type: 'json' };

// Load environment variables from .env file
dotenv.config();

// Log unexpected errors, instead of letting em crash everything
process.on('uncaughtException', (error) => console.error('Uncaught exception:', error));
process.on('unhandledRejection', (error) => console.error('Unhandled rejection:', error));

// Create the Express app
const app = express();

const trustProxy = process.env.TRUST_PROXY;
if (trustProxy) {
  const parsed = /^\d+$/.test(trustProxy)
    ? parseInt(trustProxy, 10)
    : trustProxy === 'true'
      ? true
      : trustProxy === 'false'
        ? false
        : trustProxy;
  app.set('trust proxy', parsed);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 3000; // The port to run the server on
const API_DIR = '/api'; // Name of the dir containing the lambda functions
const dirPath = path.join(__dirname, API_DIR); // Path to the lambda functions dir
const guiPath = path.join(__dirname, 'dist', 'client');
const placeholderFilePath = path.join(__dirname, 'public', 'placeholder.html');
let notFoundFilePath = path.join(__dirname, 'public', 'error.html');
const handlers = {}; // Will store list of API endpoints
const { version } = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));
const apiFiles = fs
  .readdirSync(dirPath, { withFileTypes: true })
  .filter((dirent) => dirent.isFile() && dirent.name.endsWith('.js'));
process.env.WC_SERVER = 'true'; // Tells middleware to return in non-lambda mode

// Enable CORS
app.use(
  cors({
    origin: process.env.API_CORS_ORIGIN || '*',
  }),
);

// Sits above the GUI catch-all, so it still answers even when the app itself is broken
app.get('/healthz', (req, res) => {
  res.set('Cache-Control', 'no-store'); // Stops a proxy handing a monitor a stale "ok"
  res.status(200).json({
    status: 'ok',
    // Routes register async, so we're listening a moment before they're actually live
    ready: Object.keys(handlers).length === apiFiles.length,
    version,
    revision: process.env.BUILD_REVISION || 'development',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Define max requests within each time frame
const limits = [
  { timeFrame: 10 * 60, max: 100, messageTime: '10 minutes' },
  { timeFrame: 60 * 60, max: 250, messageTime: '1 hour' },
  { timeFrame: 12 * 60 * 60, max: 500, messageTime: '12 hours' },
];

// Construct a message to be returned if the user has been rate-limited
const makeLimiterResponseMsg = (retryAfter) => {
  const why = '为保证公共服务可用，请稍后再试。';
  return `检测请求过于频繁，请稍后重试。\n${why}`;
};

// Create rate limiters for each time frame
const limiters = limits.map((limit) =>
  rateLimit({
    windowMs: limit.timeFrame * 1000,
    limit: limit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: makeLimiterResponseMsg(limit.messageTime) },
  }),
);

// If rate-limiting enabled, then apply the limiters to the /api endpoint
if (process.env.API_ENABLE_RATE_LIMIT === 'true') {
  app.use(API_DIR, limiters);
}

// Restrict the public instance to documented checks and public HTTP/HTTPS targets.
// This runs before every handler; bridge egress rules enforce destination limits again.
app.use(API_DIR, async (req, res, next) => {
  res.set('X-Robots-Tag', 'noindex, nofollow');
  const check = req.path.split('/').filter(Boolean)[0];
  if (!check || !siteConfig.checks.includes(check)) {
    return res.status(404).json({ error: '本站未提供此检测接口。' });
  }
  try {
    await assertPublicTarget(req.query.url);
    next();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Read and register each API function as an Express routes
apiFiles.forEach(async (dirent) => {
  const routeName = dirent.name.split('.')[0];
  const route = `${API_DIR}/${routeName}`;

  const handlerModule = await import(pathToFileURL(path.join(dirPath, dirent.name)).href);
  const handler = handlerModule.default || handlerModule;
  handlers[route] = handler;

  app.get(route, async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
});

const renderPlaceholderPage = async (res, msgId, logs) => {
  const errorMessages = {
    notCompiled:
      'Looks like the GUI app has not yet been compiled.<br />' +
      'Run <code>yarn build</code> to continue, then restart the server.',
    notCompiledSsrHandler:
      'Server-side rendering failed to initiate, as SSR handler not found.<br />' +
      'This can be fixed by running <code>yarn build</code>, then restarting the server.<br />',
    disabledGui:
      'Web-Check API is up and running!<br />Access the endpoints at ' +
      `<a href="${API_DIR}"><code>${API_DIR}</code></a>`,
  };
  const logOutput = logs ? `<div class="logs"><code>${logs}</code></div>` : '';
  const errorMessage = (errorMessages[msgId] || 'An mystery error occurred.') + logOutput;
  const placeholderContent = await fs.promises.readFile(placeholderFilePath, 'utf-8');
  const htmlContent = placeholderContent.replace('<!-- CONTENT -->', errorMessage);
  res.status(500).send(htmlContent);
};

// Serve up the GUI - if build dir exists, and GUI feature enabled
if (process.env.DISABLE_GUI && process.env.DISABLE_GUI !== 'false') {
  app.get('/', async (req, res) => {
    renderPlaceholderPage(res, 'disabledGui');
  });
} else if (!fs.existsSync(guiPath)) {
  app.get('/', async (req, res) => {
    renderPlaceholderPage(res, 'notCompiled');
  });
} else {
  // GUI enabled, and build files present, let's go!!
  notFoundFilePath = path.join(guiPath, '404.html');
  // Serve built pages at /page as well as /page/, without redirecting between them
  app.use(async (req, res, next) => {
    const isPageRequest = ['GET', 'HEAD'].includes(req.method) && /^[\w/-]+$/.test(req.path);
    if (!isPageRequest) return next();
    const indexFile = path.posix.join(req.path, 'index.html');
    if (await fs.promises.stat(path.join(guiPath, indexFile)).catch(() => null)) {
      req.url = indexFile + req.url.replace(/^[^?]*/, '');
    }
    next();
  });
  app.use(express.static(guiPath));
  app.use(async (req, res, next) => {
    if (req.path.startsWith(`${API_DIR}/`)) return next();
    const ssrHandlerPath = path.join(__dirname, 'dist', 'server', 'entry.mjs');
    import(ssrHandlerPath)
      .then(({ handler: ssrHandler }) => {
        ssrHandler(req, res, next);
      })
      .catch(async (err) => {
        renderPlaceholderPage(res, 'notCompiledSsrHandler', err.message);
      });
  });
}

// Anything left unhandled (which isn't an API endpoint), return a 404
app.use((req, res, next) => {
  if (!req.path.startsWith(`${API_DIR}/`)) {
    res.status(404).sendFile(notFoundFilePath, { dotfiles: 'allow' });
  } else {
    next();
  }
});

// Print nice welcome message to user
const printMessage = () => {
  console.log(
    `\x1b[36m\n` +
      '    __      __   _         ___ _           _   \n' +
      '    \\ \\    / /__| |__ ___ / __| |_  ___ __| |__\n' +
      "     \\ \\/\\/ / -_) '_ \\___| (__| ' \\/ -_) _| / /\n" +
      '      \\_/\\_/\\___|_.__/    \\___|_||_\\___\\__|_\\_\\\n' +
      `\x1b[0m\n`,
    `\x1b[1m\x1b[32m🚀 Web-Check is up and running at http://localhost:${port} \x1b[0m\n\n`,
    `\x1b[2m\x1b[36m🛟 For documentation and support, visit the GitHub repo: ` +
      `https://github.com/lissy93/web-check \n`,
    `💖 Found Web-Check useful? Consider sponsoring us on GitHub ` +
      `to help fund maintenance & development.\x1b[0m`,
  );
};

// Create server
app.listen(port, () => {
  printMessage();
});
