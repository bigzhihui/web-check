import type { Analyzer } from '../types';

// One year, the shortest max-age the HSTS preload list accepts
export const MIN_MAX_AGE = 31536000;

// The max-age and flags an HSTS header sets
export const parseHsts = (header: string) => {
  const lower = header.toLowerCase();
  return {
    maxAge: Number(/max-age\s*=\s*"?(\d+)/.exec(lower)?.[1] || 0),
    includeSubDomains: lower.includes('includesubdomains'),
    preload: lower.includes('preload'),
  };
};

// Check HSTS presence, max-age, includeSubDomains, preload
const hsts: Analyzer = (d) => {
  if (!d.hstsHeader) {
    return [
      {
        severity: 'issue',
        title: '未设置 HSTS 响应头',
        detail: '可设置 Strict-Transport-Security，让浏览器在有效期内使用 HTTPS',
      },
    ];
  }
  const { maxAge, includeSubDomains, preload } = parseHsts(String(d.hstsHeader));
  const out: ReturnType<Analyzer> = [];
  if (maxAge < MIN_MAX_AGE) {
    out.push({
      severity: 'warning',
      title: 'HSTS 有效期不足一年',
      detail: `当前 max-age 为 ${maxAge} 秒；如需申请预加载，需至少达到 ${MIN_MAX_AGE} 秒`,
    });
  }
  if (!includeSubDomains) {
    out.push({
      severity: 'warning',
      title: 'HSTS 未包含 includeSubDomains',
      detail: 'includeSubDomains 可将策略扩展到所有子域名，启用前需确认各子域名均支持 HTTPS',
    });
  }
  if (!preload) {
    out.push({
      severity: 'info',
      title: 'HSTS 未包含 preload 指令',
      detail: '如需申请 HSTS 预加载，还需设置 preload 指令并满足预加载要求',
    });
  }
  if (d.compatible) out.push({ severity: 'pass', title: '配置符合 HSTS 预加载要求' });
  return out;
};

export default hsts;
