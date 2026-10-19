import type { Analyzer, Result } from '../types';
type DkimKey = { selector: string; bits: number | null };

export interface MailData {
  mxRecords?: { exchange: string }[];
  txtRecords?: string[][];
  spfLookups?: number;
  dmarcDomain?: string;
  dkim?: DkimKey[];
  mtaSts?: { mode?: string; mx: string[] };
  dane?: string[];
}

// Join each record's DNS chunks, keeping those that start with the given version tag
export const findRecords = (txtRecords: string[][] = [], prefix: string) =>
  txtRecords
    .map((chunks) => chunks.join(''))
    .filter((record) => record.toLowerCase().startsWith(prefix.toLowerCase()));

// Split a "tag=value; tag=value" record into an object keyed by lowercase tag
const parseTags = (record: string): Record<string, string | undefined> =>
  Object.fromEntries(
    record.split(';').map((part) => {
      const [tag, ...value] = part.split('=');
      return [tag.trim().toLowerCase(), value.join('=').trim()];
    }),
  );

// Whether mail from servers not in the SPF record fails, via -all, ~all or a redirect
const spfFailsUnlisted = (spf: string) => {
  const terms = spf.toLowerCase().split(' ');
  const all = terms.find((term) => ['all', '+all', '-all', '~all', '?all'].includes(term));
  if (all) return all === '-all' || all === '~all';
  return terms.some((term) => term.startsWith('redirect='));
};

// An SPF record of just "v=spf1 -all" says the domain sends no mail
export const sendsNoMail = (d: MailData) => {
  const spf = findRecords(d.txtRecords, 'v=spf1')[0] || '';
  return spf.toLowerCase().split(' ').filter(Boolean).join(' ') === 'v=spf1 -all';
};

const enforced = (policy = '') => ['quarantine', 'reject'].includes(policy.toLowerCase());

export const checkSpf = (d: MailData): Result => {
  const spf = findRecords(d.txtRecords, 'v=spf1');
  if (!spf.length) {
    return {
      severity: 'issue',
      title: '未发现 SPF 记录',
      detail: '可发布 v=spf1 TXT 记录列出授权发件服务器；不发送邮件的域名可评估设置 v=spf1 -all',
    };
  }
  if (spf.length > 1) {
    return {
      severity: 'issue',
      title: '发现多条 SPF 记录',
      detail: '多条记录会导致 SPF 错误，应合并为一条 v=spf1 记录',
    };
  }
  if ((d.spfLookups ?? 0) > 10) {
    return {
      severity: 'issue',
      title: `SPF 需要 ${d.spfLookups} 次 DNS 查询，超过 10 次限制`,
      detail:
        '超过 10 次查询会导致 SPF 失败，可移除不再使用的 include，或评估用 ip4/ip6 网段替代部分查询',
    };
  }
  if (!spfFailsUnlisted(spf[0])) {
    return {
      severity: 'warning',
      title: 'SPF 未限制未列出的发件服务器',
      detail: '可按发件需求评估以 -all 或 ~all 结束记录，限制未授权发件服务器',
    };
  }
  return { severity: 'pass', title: '已发布 SPF 记录' };
};

export const checkDmarc = (d: MailData): Result => {
  const dmarc = findRecords(d.txtRecords, 'v=DMARC1');
  if (!dmarc.length) {
    return {
      severity: 'issue',
      title: '未发现 DMARC 记录',
      detail: '可在 _dmarc 子域名发布 v=DMARC1 TXT 记录，供收件方处理伪造邮件',
    };
  }
  if (dmarc.length > 1) {
    return {
      severity: 'issue',
      title: '发现多条 DMARC 记录',
      detail: '多条记录会导致收件方忽略 DMARC，应合并为一条记录',
    };
  }
  const tags = parseTags(dmarc[0]);
  const tag = d.dmarcDomain && tags.sp ? 'sp' : 'p';
  const policy = tags[tag]?.toLowerCase();
  const from = d.dmarcDomain ? `（来自 ${d.dmarcDomain}）` : '';
  const percent = tags.pct ? Number(tags.pct) : 100;
  if (!enforced(policy)) {
    const next = `设置 ${tag}=quarantine 或 ${tag}=reject`;
    return {
      severity: 'warning',
      title: `DMARC 策略仅监测${from}`,
      detail: tags.rua
        ? `未通过 DMARC 的邮件仍可投递；确认合法邮件均能通过后，可${next}`
        : `未通过 DMARC 的邮件仍可投递，且未设置报告接收地址；可添加 rua=mailto:<address>，核对报告后再${next}`,
    };
  }
  if (percent < 100) {
    return {
      severity: 'warning',
      title: `DMARC 策略仅覆盖 ${percent}% 的验证失败邮件${from}`,
      detail: '可将 pct 调整为 100 或移除此参数，使策略覆盖所有验证失败邮件',
    };
  }
  return { severity: 'pass', title: `DMARC 策略：${policy}${from}` };
};

export const checkSubdomainDmarc = (d: MailData): Result | null => {
  const dmarc = findRecords(d.txtRecords, 'v=DMARC1');
  if (dmarc.length !== 1 || d.dmarcDomain) return null;
  const { p, sp } = parseTags(dmarc[0]);
  if (!sp || !enforced(p) || enforced(sp)) return null;
  return {
    severity: 'warning',
    title: 'DMARC 策略未覆盖子域名',
    detail: `sp=${sp} 允许子域名伪造邮件通过；可评估设置 sp=quarantine、sp=reject，或移除 sp 以继承 p 策略`,
  };
};

export const checkDkim = (d: MailData): Result => {
  const keys = d.dkim ?? [];
  const names = (list: DkimKey[]) => list.map((key) => key.selector).join(', ');
  const weak = keys.filter((key) => key.bits && key.bits < 1024);
  const short = keys.filter((key) => key.bits === 1024);
  if (!keys.length && sendsNoMail(d)) {
    return { severity: 'pass', title: '此域名声明不发送邮件，无需 DKIM' };
  }
  if (!keys.length) {
    return {
      severity: 'info',
      title: '常见选择器下未发现 DKIM 公钥',
      detail:
        'DKIM 可使用任意选择器名称，可能已配置在本次未检查的选择器下。' +
        '若尚未配置，可发布 DKIM 公钥供收件方验证邮件',
    };
  }
  if (weak.length) {
    return {
      severity: 'issue',
      title: `DKIM 密钥不足 1024 位（${names(weak)}）`,
      detail: '过短密钥的签名可能被收件方忽略，可替换为 2048 位密钥',
    };
  }
  if (short.length) {
    return {
      severity: 'info',
      title: `DKIM 使用 1024 位密钥（${names(short)}）`,
      detail: '可评估更换为 2048 位密钥，或联系邮件服务提供商处理',
    };
  }
  return { severity: 'pass', title: `已发现 DKIM 公钥（${names(keys)}）` };
};

// The hosts that receive this domain's mail, from its MX records
export const mxHosts = (d: MailData) =>
  (d.mxRecords || []).map((record) => record.exchange.toLowerCase()).filter(Boolean);

// True when an MTA-STS mx line covers a host, a leading * standing for one label
const coversHost = (pattern: string, host: string) =>
  pattern.startsWith('*.')
    ? host.split('.').slice(1).join('.') === pattern.slice(2)
    : host === pattern;

export const checkMtaSts = (d: MailData): Result | null => {
  const hosts = mxHosts(d);
  const policy = d.mtaSts;
  if (!hosts.length) return null;
  if (!policy) {
    return {
      severity: 'info',
      title: '未配置 MTA-STS',
      detail: '未设置此策略时，邮件传输可能被降级为非加密连接',
    };
  }
  if (!policy.mode) {
    return {
      severity: 'warning',
      title: 'MTA-STS 策略无法读取或无效',
      detail: '需要一条 v=STSv1 记录及有效的 mta-sts.<domain>/.well-known/mta-sts.txt 策略文件',
    };
  }
  const patterns = policy.mx.map((pattern) => pattern.toLowerCase().replace(/\.$/, ''));
  const missing = hosts.filter((host) => !patterns.some((pattern) => coversHost(pattern, host)));
  if (missing.length && policy.mode !== 'none') {
    return {
      severity: policy.mode === 'enforce' ? 'issue' : 'warning',
      title: `MTA-STS 策略未覆盖 ${missing.join('、')}`,
      detail: '强制策略下，发件方会拒绝向未覆盖的 MX 主机投递，可核对并补充 mx: 配置',
    };
  }
  if (policy.mode !== 'enforce') {
    return {
      severity: 'info',
      title: `MTA-STS 当前模式为 ${policy.mode}`,
      detail: '确认 TLS 报告显示邮件能正常加密投递后，可评估切换为 mode: enforce',
    };
  }
  return { severity: 'pass', title: 'MTA-STS 已启用强制策略' };
};

export const checkTlsRpt = (d: MailData): Result | null => {
  if (!d.mtaSts && !d.dane?.length) return null;
  if (findRecords(d.txtRecords, 'v=TLSRPTv1').length) {
    return { severity: 'pass', title: '已配置 TLS-RPT 报告' };
  }
  return {
    severity: 'info',
    title: '未设置 TLS-RPT 记录',
    detail: '可在 _smtp._tls 发布 v=TLSRPTv1 TXT 记录，以接收邮件 TLS 传输失败报告',
  };
};

const checkDane = (d: MailData): Result | null => {
  const hosts = mxHosts(d);
  if (!d.dane?.length) return null;
  return {
    severity: 'pass',
    title: `${hosts.length} 个 MX 主机中有 ${d.dane.length} 个设置了 DANE TLSA 记录`,
  };
};

const mailConfig: Analyzer = (d) =>
  [
    checkSpf(d),
    checkDmarc(d),
    checkSubdomainDmarc(d),
    checkDkim(d),
    checkMtaSts(d),
    checkTlsRpt(d),
    checkDane(d),
  ].filter((r) => r !== null);

export default mailConfig;
