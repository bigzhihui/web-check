import type { Analyzer, Result } from '../types';

const CRITICAL: Record<string, string> = {
  contentSecurityPolicy: 'Content-Security-Policy',
  strictTransportPolicy: 'Strict-Transport-Security',
  xContentTypeOptions: 'X-Content-Type-Options',
  xFrameOptions: 'X-Frame-Options',
};

const RECOMMENDED: Record<string, string> = {
  referrerPolicy: 'Referrer-Policy',
  permissionsPolicy: 'Permissions-Policy',
  crossOriginOpenerPolicy: 'Cross-Origin-Opener-Policy',
  crossOriginResourcePolicy: 'Cross-Origin-Resource-Policy',
  crossOriginEmbedderPolicy: 'Cross-Origin-Embedder-Policy',
};

export const HEADERS = { ...CRITICAL, ...RECOMMENDED, xXSSProtection: 'X-XSS-Protection' };

// Script sources that let any site, or a data: URL, run scripts
const ANY_SOURCE = ['*', 'http:', 'https:', 'data:'];

// Referrer policies that send the full URL to other sites
const LEAKY_REFERRERS = ['unsafe-url', 'no-referrer-when-downgrade'];

// Split a CSP header into its policies, each mapping a directive to its sources
const parseCsp = (header: string): Record<string, string[]>[] =>
  header.split(',').map((policy) =>
    Object.fromEntries(
      policy.split(';').map((directive) => {
        const [name, ...sources] = directive.trim().toLowerCase().split(/\s+/);
        return [name, sources];
      }),
    ),
  );

// True when a CSP header sets frame-ancestors, which replaces X-Frame-Options
export const hasFrameAncestors = (d: any) =>
  !!d.contentSecurityPolicy && parseCsp(d.contentSecurityPolicy).some((p) => p['frame-ancestors']);

// Flag a CSP that leaves scripts open to injection, or skips object-src and base-uri
const checkCsp = (header: string): Result[] => {
  const policies = parseCsp(header);
  const scripts = policies.map((p) => p['script-src'] || p['default-src']);
  if (scripts.every((sources) => !sources)) {
    return [
      {
        severity: 'warning',
        title: 'Content-Security-Policy 未限制脚本来源',
        detail: '可设置 script-src 或 default-src，限制可运行的脚本来源',
      },
    ];
  }
  // True when every policy lets through the scripts the test describes
  const allows = (test: (sources: string[]) => boolean) =>
    scripts.every((sources) => !sources || test(sources));
  const out: Result[] = [];
  const nonced = (sources: string[]) => sources.some((s) => /^'(nonce|sha\d+)-/.test(s));
  if (allows((sources) => sources.includes("'unsafe-inline'") && !nonced(sources))) {
    out.push({
      severity: 'warning',
      title: 'Content-Security-Policy 允许内联脚本',
      detail: "'unsafe-inline' 可能允许注入的脚本运行，可评估使用 nonce 或哈希校验",
    });
  }
  const wildcard = (sources: string[]) => sources.some((s) => ANY_SOURCE.includes(s));
  if (allows((sources) => wildcard(sources) && !sources.includes("'strict-dynamic'"))) {
    out.push({
      severity: 'warning',
      title: 'Content-Security-Policy 允许任意来源的脚本',
      detail: '可将 script-src 中的 *、http:、https: 或 data: 调整为实际使用的脚本来源',
    });
  }
  if (allows((sources) => sources.includes("'unsafe-eval'"))) {
    out.push({
      severity: 'info',
      title: 'Content-Security-Policy 允许 eval()',
      detail: "'unsafe-eval' 允许将文本作为代码执行，可能扩大脚本注入的影响",
    });
  }
  const unset = ['object-src', 'base-uri'].filter(
    (name) => !policies.some((p) => p[name] || (name === 'object-src' && p['default-src'])),
  );
  if (unset.length) {
    out.push({
      severity: 'info',
      title: `Content-Security-Policy 未设置 ${unset.join(' 或 ')}`,
      detail: "object-src 'none' 可阻止插件，base-uri 'self' 可限制注入的 <base> 标签",
    });
  }
  return out;
};

// An issue for a header whose value gives no protection
const badValue = (label: string, value: string, detail: string): Result[] => [
  { severity: 'issue', title: `${label} 的取值为“${value}”`, detail },
];

// Problems with a header's value, for headers that only work with certain values
const checkValue: Record<string, (value: string) => Result[]> = {
  contentSecurityPolicy: checkCsp,
  strictTransportPolicy: (value) =>
    Number(/max-age\s*=\s*"?(\d+)/i.exec(value)?.[1]) > 0
      ? []
      : badValue(
          'Strict-Transport-Security',
          value,
          '浏览器按 max-age 指定的秒数强制使用 HTTPS；未设置或设为 0 会关闭 HSTS',
        ),
  xContentTypeOptions: (value) =>
    /^\s*nosniff\s*(,|$)/i.test(value)
      ? []
      : badValue(
          'X-Content-Type-Options',
          value,
          '有效值为 nosniff，其他取值不会启用浏览器的此项保护',
        ),
  xFrameOptions: (value) =>
    value.split(',').some((option) => /^\s*(deny|sameorigin)\s*$/i.test(option))
      ? []
      : badValue('X-Frame-Options', value, '有效值为 DENY 或 SAMEORIGIN，其他取值不会启用此项保护'),
  referrerPolicy: (value) =>
    LEAKY_REFERRERS.includes(value.split(',').pop()!.trim().toLowerCase())
      ? [
          {
            severity: 'warning',
            title: `Referrer-Policy“${value}”会向其他网站发送完整网址`,
            detail: '页面链接或加载其他网站时，可能暴露网址中的路径与查询参数',
          },
        ]
      : [],
  xXSSProtection: (value) =>
    value.trim().startsWith('0')
      ? []
      : [
          {
            severity: 'info',
            title: '已启用 X-XSS-Protection',
            detail: '现代浏览器已弃用此过滤器，旧实现也存在风险，可评估将其设为 0',
          },
        ],
};

// Findings for one header, from whether it's set and what it's set to
export const checkHeader = (d: any, key: string): Result[] => {
  const label = HEADERS[key as keyof typeof HEADERS];
  if (key === 'xFrameOptions' && hasFrameAncestors(d)) {
    return [{ severity: 'pass', title: '已通过 CSP frame-ancestors 限制页面嵌入' }];
  }
  if (d[key]) {
    const problems = checkValue[key]?.(String(d[key])) || [];
    const passed = CRITICAL[key] && problems.every((p) => p.severity === 'info');
    return passed ? [{ severity: 'pass', title: `已设置 ${label}` }, ...problems] : problems;
  }
  if (CRITICAL[key]) {
    return [
      {
        severity: 'issue',
        title: `未设置 ${label}`,
        detail: `可配置 ${label} 响应头`,
      },
    ];
  }
  if (RECOMMENDED[key]) {
    return [
      {
        severity: 'warning',
        title: `未设置 ${label}`,
        detail: `可按网站需求评估是否添加 ${label} 响应头`,
      },
    ];
  }
  return [];
};

// Flag missing headers, and values that weaken them
const httpSecurity: Analyzer = (d) => Object.keys(HEADERS).flatMap((key) => checkHeader(d, key));

export default httpSecurity;
