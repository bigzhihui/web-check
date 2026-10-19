import middleware from './_common/middleware.js';
import { httpGet, isBotCheck, BOT_CHECK_ERROR } from './_common/http.js';

// One year, the shortest max-age the HSTS preload list accepts
const MIN_MAX_AGE = 31536000;

const verdict = (message, compatible = false, hstsHeader = null) => ({
  message,
  compatible,
  hstsHeader,
});

const evaluate = (header) => {
  if (!header) return verdict('网站未返回 HSTS 响应头。');
  const lower = header.toLowerCase();
  const maxAge = Number(/max-age\s*=\s*"?(\d+)/.exec(lower)?.[1] || 0);
  if (maxAge < MIN_MAX_AGE)
    return verdict(
      `HSTS 有效期为 ${maxAge} 秒，低于预加载要求的 ${MIN_MAX_AGE} 秒。`,
      false,
      header,
    );
  if (!lower.includes('includesubdomains'))
    return verdict('HSTS 未包含 includeSubDomains，策略未覆盖所有子域名。', false, header);
  if (!lower.includes('preload')) return verdict('HSTS 未包含 preload 预加载指令。', false, header);
  return verdict('网站配置符合 HSTS 预加载要求。', true, header);
};

// Read HSTS from the first HTTPS response, without following redirects, unless a bot check hid it
const hstsHandler = async (url) => {
  try {
    const target = new URL(url);
    target.protocol = 'https:';
    const response = await httpGet(target.href, { redirect: 'manual', validateStatus: () => true });
    const header = response.headers['strict-transport-security'];
    if (!header && isBotCheck(response)) return BOT_CHECK_ERROR;
    return evaluate(header);
  } catch (error) {
    return { error: `HSTS 检测失败：${error.code || error.message}` };
  }
};

export const handler = middleware(hstsHandler);
export default handler;
