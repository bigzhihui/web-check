import test from 'node:test';
import assert from 'node:assert/strict';
import { assertPublicTarget, isPublicAddress } from '../api/_common/public-target.js';

const publicDns = async () => [{ address: '104.21.49.95' }];
test('public domains keep their path and query', async () => {
  assert.equal(
    await assertPublicTarget('example.com/page?q=1', publicDns),
    'https://example.com/page?q=1',
  );
});
for (const ip of [
  '127.0.0.1',
  '10.2.3.4',
  '172.16.1.1',
  '192.168.1.1',
  '169.254.169.254',
  '100.64.0.1',
  '198.18.0.1',
  '224.0.0.1',
  '::1',
  'fe80::1',
  'fd00::1',
  '::ffff:127.0.0.1',
  '::ffff:8.8.8.8',
  '2001:db8::1',
]) {
  test(`reject non-public address ${ip}`, () => assert.equal(isPublicAddress(ip), false));
}
for (const value of [
  'http://localhost',
  'http://x.localhost',
  'http://0x7f000001',
  'http://2130706433',
  'http://127.1',
  'http://user:pass@example.com',
  'https://example.com:8443',
  'https://check.afeiii.com',
  'https://[::1]',
  'ftp://example.com',
  'file:///etc/passwd',
  'gopher://example.com',
]) {
  test(`reject unsafe scan target ${value}`, async () => {
    await assert.rejects(assertPublicTarget(value, publicDns));
  });
}
test('reject domains resolving to private addresses', async () => {
  await assert.rejects(assertPublicTarget('example.com', async () => [{ address: '127.0.0.1' }]));
});
test('reject mixed public/private DNS answers', async () => {
  await assert.rejects(
    assertPublicTarget('example.com', async () => [
      { address: '104.21.49.95' },
      { address: '10.0.0.1' },
    ]),
  );
});
test('allow global IPv4 and IPv6', () => {
  assert.equal(isPublicAddress('8.8.8.8'), true);
  assert.equal(isPublicAddress('2606:4700:4700::1111'), true);
});
