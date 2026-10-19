import type { Analyzer } from '../types';

// Warn when no CAA issue tag limits which CAs can issue certificates
const caaRecords: Analyzer = (d) => {
  const records: any[] = Array.isArray(d.records) ? d.records : [];
  const issue = records.filter((r) => r.tag === 'issue');
  if (!issue.length) {
    return [
      {
        severity: 'warning',
        title: records.length ? 'CAA 记录未包含 issue 标记' : '未设置 CAA 记录',
        detail: '域名未限制可为其签发证书的证书机构',
      },
    ];
  }
  const issuers = [...new Set(issue.map((r) => r.value.split(';')[0].trim()).filter(Boolean))];
  if (!issuers.length) {
    return [{ severity: 'info', title: 'CAA 已禁止所有证书机构签发证书' }];
  }
  return [
    {
      severity: 'pass',
      title: `CAA 将证书签发限制为 ${issuers.length} 家证书机构`,
      detail: issuers.join(', '),
    },
  ];
};

export default caaRecords;
