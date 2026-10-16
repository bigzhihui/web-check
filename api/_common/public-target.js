import { BlockList, isIP } from 'node:net';
import { lookup } from 'node:dns/promises';

const denied = new BlockList();
for (const [network, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
])
  denied.addSubnet(network, prefix, 'ipv4');
const globalV6 = new BlockList();
globalV6.addSubnet('2000::', 3, 'ipv6');
denied.addSubnet('2001:db8::', 32, 'ipv6');

export const isPublicAddress = (address) => {
  const family = isIP(address);
  if (family === 4) return !denied.check(address, 'ipv4');
  if (family === 6) return globalV6.check(address, 'ipv6') && !denied.check(address, 'ipv6');
  return false;
};

// DNS is checked before every scan. Deployment firewall rules also reject private destinations
// at connection time, covering a later DNS change or an HTTP redirect into the private network.
export const assertPublicTarget = async (input, resolve = lookup) => {
  if (typeof input !== 'string' || input.length > 2048 || !input.trim()) {
    throw new Error('请输入有效的网站域名或 HTTP/HTTPS 地址。');
  }
  const raw = input.trim();
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(raw) && !/^https?:\/\//i.test(raw)) {
    throw new Error('本站仅接受 HTTP/HTTPS 网站地址。');
  }
  const target = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  const hostname = target.hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (
    !['http:', 'https:'].includes(target.protocol) ||
    target.username ||
    target.password ||
    (target.port && !['80', '443'].includes(target.port)) ||
    hostname === 'localhost' ||
    /\.(?:localhost|local|internal)$/i.test(hostname) ||
    hostname === 'check.afeiii.com'
  ) {
    throw new Error('本站仅检测公网网站的 HTTP/HTTPS 服务，不接受此地址。');
  }
  const addresses = isIP(hostname)
    ? [{ address: hostname }]
    : await resolve(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new Error('该地址指向内网、保留网段或本机，本站不提供此类检测。');
  }
  return target.href;
};
