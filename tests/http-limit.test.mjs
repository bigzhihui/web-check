import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { httpGet } from '../api/_common/http.js';

test('HTTP reader accepts a normal response and aborts oversized bodies', async () => {
  const server = createServer((req, res) => {
    if (req.url === '/large') res.end('a'.repeat(2 * 1024 * 1024 + 1));
    else {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true }));
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    assert.deepEqual((await httpGet(base)).data, { ok: true });
    await assert.rejects(httpGet(`${base}/large`), /2 MiB/);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
