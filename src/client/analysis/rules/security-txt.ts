import type { Analyzer, Result } from '../types';
import { daysUntil } from '../helpers';

// A field's value, matching its name in any case, and ignoring numbers added to repeats
export const getField = (fields: Record<string, string> = {}, name: string) =>
  Object.entries(fields).find(([key]) => key.toLowerCase().replace(/\d+$/, '') === name)?.[1];

// A problem when the file has no Contact field
export const checkContact = (fields?: Record<string, string>): Result | null =>
  getField(fields, 'contact')
    ? null
    : {
        severity: 'issue',
        title: 'security.txt 缺少 Contact 联系字段',
        detail: 'Contact 用于说明安全问题的报告方式，是 security.txt 的必需字段',
      };

// A problem with the Expires field, when it's missing, past, or over a year ahead
export const checkExpires = (fields?: Record<string, string>): Result | null => {
  const days = daysUntil(getField(fields, 'expires'));
  if (days === null) {
    return {
      severity: 'warning',
      title: 'security.txt 缺少有效的 Expires 到期日期',
      detail: 'Expires 为必需字段，宜设置为未来一年以内的日期，例如 2027-01-01T00:00:00Z',
    };
  }
  if (days < 0) {
    return {
      severity: 'warning',
      title: `security.txt 已过期 ${-days} 天`,
      detail: '文件已过期，请核对联系信息并更新 Expires 日期',
    };
  }
  if (days > 366) {
    return {
      severity: 'info',
      title: 'security.txt 的到期日期超过一年',
      detail: '可将 Expires 设为未来一年以内，以便定期核对文件内容',
    };
  }
  return null;
};

// Flag a missing security.txt, or one missing the Contact and Expires fields it needs
const securityTxt: Analyzer = (d) => {
  if (!d.isPresent) {
    return [
      {
        severity: 'warning',
        title: '未发布 security.txt',
        detail: '可在 /.well-known/security.txt 中提供安全问题的联系信息',
      },
    ];
  }
  const out: ReturnType<Analyzer> = [{ severity: 'pass', title: '已发现 security.txt' }];
  for (const check of [checkContact(d.fields), checkExpires(d.fields)]) {
    if (check) out.push(check);
  }
  if (!d.isPgpSigned) {
    out.push({
      severity: 'info',
      title: 'security.txt 未使用 PGP 签名',
      detail: 'PGP 签名可帮助研究人员验证文件真实性',
    });
  }
  return out;
};

export default securityTxt;
