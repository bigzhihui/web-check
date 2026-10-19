import type { Analyzer, Result } from '../types';

// A note on how many redirects the chain follows, warning when it's long
export const checkHops = (chain: string[]): Result | null => {
  const hops = chain.length - 1;
  if (hops >= 4) {
    return {
      severity: 'warning',
      title: `跳转链较长：${hops} 次跳转`,
      detail: '可减少中间跳转，降低访问耗时',
    };
  }
  return hops > 0 ? { severity: 'info', title: `共 ${hops} 次跳转` } : null;
};

// Whether a chain that starts on HTTP ends up on HTTPS, or null when it starts on HTTPS
export const checkHttps = (chain: string[]): Result | null => {
  if (!/^http:\/\//i.test(chain[0])) return null;
  if (/^https:\/\//i.test(chain[chain.length - 1])) {
    return { severity: 'pass', title: 'HTTP 请求已跳转到 HTTPS' };
  }
  return {
    severity: 'critical',
    title: '网站未将 HTTP 强制跳转到 HTTPS',
    detail: '可将 http:// 永久跳转到 https://',
  };
};

// Inspect the HTTP redirect chain for length and HTTPS upgrade
const redirects: Analyzer = (d) => {
  const chain: string[] = Array.isArray(d?.redirects)
    ? d.redirects.filter((u: unknown) => typeof u === 'string')
    : [];
  if (!chain.length) return [];
  return [checkHops(chain), checkHttps(chain)].filter((r) => r !== null);
};

export default redirects;
