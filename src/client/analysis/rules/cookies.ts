import type { Analyzer, Result } from '../types';

// Parse Set-Cookie headers (one per array element) into name + attribute list,
// skipping nameless entries (empty lines, cookie-deletion stubs like "=; Path=/")
const parseCookies = (raw: unknown): Array<{ name: string; attrs: string[] }> => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((line) => {
      const parts = String(line).split(/;\s*/);
      const name = parts[0].split('=')[0].trim();
      const attrs = parts.slice(1).map((p) => p.split('=')[0].trim().toLowerCase());
      return { name, attrs };
    })
    .filter((c) => c.name);
};

// The Secure, HttpOnly and SameSite flags a cookie is missing, from its lowercase attribute names
export const checkCookie = (name: string, attrs: string[]): Result[] => {
  const out: Result[] = [];
  if (!attrs.includes('secure')) {
    out.push({ severity: 'issue', title: `Cookie“${name}”缺少 Secure 属性` });
  }
  if (!attrs.includes('httponly')) {
    out.push({ severity: 'warning', title: `Cookie“${name}”缺少 HttpOnly 属性` });
  }
  if (!attrs.includes('samesite')) {
    out.push({ severity: 'warning', title: `Cookie“${name}”缺少 SameSite 属性` });
  }
  return out;
};

// Audit Set-Cookie attributes for Secure, HttpOnly, SameSite
const cookies: Analyzer = (d) => {
  const parsed = parseCookies(d.headerCookies);
  if (!parsed.length) return [];
  const out = parsed.flatMap(({ name, attrs }) => checkCookie(name, attrs));
  if (!out.length)
    out.push({ severity: 'pass', title: '所有 Cookie 均设置了 Secure、HttpOnly 和 SameSite' });
  return out;
};

export default cookies;
