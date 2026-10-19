import type { Analyzer, Result } from '../types';
import { daysUntil } from '../helpers';

// Plain reasons for the validation errors sites most often get
export const REASONS: Record<string, string> = {
  UNABLE_TO_VERIFY_LEAF_SIGNATURE: '服务器未发送中间证书',
  UNABLE_TO_GET_ISSUER_CERT_LOCALLY: '服务器未发送中间证书',
  DEPTH_ZERO_SELF_SIGNED_CERT: '自签名证书，并非由受信任的证书机构签发',
  SELF_SIGNED_CERT_IN_CHAIN: '证书链终止于浏览器不信任的根证书',
  ERR_TLS_CERT_ALTNAME_INVALID: '证书未覆盖此主机名',
};

// A problem with when the certificate expires, or null when it's over a month away
export const checkExpiry = (validTo: unknown): Result | null => {
  const days = daysUntil(validTo);
  if (days === null || days > 30) return null;
  if (days < 0) {
    return {
      severity: 'critical',
      title: 'SSL 证书已过期',
      detail: `已过期 ${-days} 天`,
    };
  }
  if (days <= 7) {
    return {
      severity: 'critical',
      title: 'SSL 证书将在一周内到期',
      detail: `将在 ${days} 天后到期，请尽快续期`,
    };
  }
  if (days <= 14) {
    return {
      severity: 'issue',
      title: 'SSL 证书即将到期',
      detail: `将在 ${days} 天后到期，请安排续期`,
    };
  }
  return {
    severity: 'warning',
    title: 'SSL 证书将在一个月内到期',
    detail: `将在 ${days} 天后到期`,
  };
};

// Check certificate validity and expiry window
const ssl: Analyzer = (d) => {
  const out: ReturnType<Analyzer> = [];
  if (d.isValid === false) {
    out.push({
      severity: 'critical',
      title: 'SSL 证书无效',
      detail: REASONS[d.authError] || d.authError || '证书验证未通过',
    });
  } else if (d.isValid === true) {
    out.push({ severity: 'pass', title: 'SSL 证书有效' });
  }
  const expiry = checkExpiry(d.valid_to);
  if (expiry) out.push(expiry);
  return out;
};

export default ssl;
