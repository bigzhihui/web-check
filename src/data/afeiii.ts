import site from '../../site-config.json';
export { site };
export const enabledChecks = new Set(site.checks);
export const checkText: Record<string, [string, string]> = {
  'get-ip': ['IP 地址', '查询域名解析到的公网 IP 地址。'],
  ssl: ['SSL 证书', '查看证书签发机构、有效期、域名与证书链。'],
  dns: ['DNS 记录', '查询 A、AAAA、MX、NS、CNAME 等域名记录。'],
  cookies: ['Cookie 检查', '查看首次响应中的 Cookie 与安全属性。'],
  'robots-txt': ['抓取规则', '读取 robots.txt，了解网站对爬虫的访问规则。'],
  headers: ['HTTP 响应头', '查看服务器返回的响应头与服务信息。'],
  redirects: ['跳转链', '检查网站的 HTTP 跳转路径与最终地址。'],
  'txt-records': ['TXT 记录', '查看域名验证、邮件策略等 TXT 记录。'],
  status: ['网站响应', '检测网站响应状态及各阶段耗时。'],
  'caa-records': ['CAA 记录', '查看允许为域名签发证书的证书机构。'],
  hsts: ['HSTS 检查', '查看网站是否声明强制 HTTPS 及其有效时间。'],
  'dns-server': ['权威 DNS', '查看域名的权威名称服务器。'],
  sitemap: ['站点地图', '读取网站 sitemap，查看页面发现入口。'],
  'security-txt': ['安全联系信息', '读取网站公开的 security.txt 安全联系信息。'],
  'linked-pages': ['页面链接', '查看页面包含的站内与外部链接。'],
  'social-tags': ['SEO 与分享标签', '查看标题、描述、canonical 与社交分享标签。'],
  'mail-config': ['邮件域名配置', '检查 MX、SPF、DKIM 与 DMARC 等公开邮件记录。'],
  'http-security': ['HTTP 安全头', '查看 CSP、防止类型嗅探等响应安全策略。'],
};
