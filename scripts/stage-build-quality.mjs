import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// /check is an SSR form endpoint. Its absence from dist/client is not a broken route.
const destination = process.argv[2];
if (!destination) throw Error('Supply a new temporary validation directory');
const route = await readFile('src/pages/check/index.astro', 'utf8');
const server = await readFile('dist/server/entry.mjs', 'utf8');
if (!/export const prerender\s*=\s*false/.test(route) || !server.includes('"route":"/check"')) {
  throw Error('The expected /check SSR route is missing');
}
await mkdir(destination); // Never overwrite an existing directory.
await cp('dist/client', destination, { recursive: true });
await mkdir(join(destination, 'check'), { recursive: true });
await writeFile(join(destination, 'check/index.html'), await readFile('dist/client/index.html'));
console.log('Staged static output and the verified /check SSR endpoint for offline validation');
