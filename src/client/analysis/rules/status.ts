import type { Analyzer, Result } from '../types';

const SLOW_MS = 2000;
const VERY_SLOW_MS = 5000;

// A note on a slow response time, or null when it's quick enough
export const checkResponseTime = (ms: number): Result | null => {
  if (ms >= VERY_SLOW_MS) {
    return {
      severity: 'warning',
      title: `响应较慢：${Math.round(ms)} 毫秒`,
      detail: '可检查服务器性能、缓存命中情况与 CDN 覆盖',
    };
  }
  if (ms >= SLOW_MS) return { severity: 'info', title: `响应时间超过 ${SLOW_MS} 毫秒` };
  return null;
};

// Reachability + latency. Non-success codes never reach here, the API throws
const status: Analyzer = (d) => {
  const out: ReturnType<Analyzer> = [];
  const code = Number(d.responseCode);
  if (Number.isFinite(code)) {
    out.push({ severity: 'pass', title: `网站返回状态码 ${code}` });
  }
  const slow = checkResponseTime(Number(d.responseTime));
  if (slow) out.push(slow);
  return out;
};

export default status;
