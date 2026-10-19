import { Card } from 'client/components/Form/Card';
import Row, { ExpandableRow, ListRow } from 'client/components/Form/Row';
import { fromFinding } from 'client/components/misc/Icon';
import { REASONS, checkExpiry } from 'client/analysis/rules/ssl';

function getExtendedKeyUsage(oids: string[]) {
  const oidMap: { [key: string]: string } = {
    '1.3.6.1.5.5.7.3.1': 'TLS 网站服务器认证',
    '1.3.6.1.5.5.7.3.2': 'TLS 客户端认证',
    '1.3.6.1.5.5.7.3.3': '代码签名',
    '1.3.6.1.5.5.7.3.4': '邮件保护（SMIME）',
    '1.3.6.1.5.5.7.3.8': '时间戳签名',
    '1.3.6.1.5.5.7.3.9': 'OCSP 签名',
    '1.3.6.1.5.5.7.3.5': 'IPSec 终端',
    '1.3.6.1.5.5.7.3.6': 'IPSec 隧道',
    '1.3.6.1.5.5.7.3.7': 'IPSec 用户',
    '1.3.6.1.5.5.8.2.2': 'IKE 中间证书',
    '2.16.840.1.113730.4.1': 'Netscape 服务器加密',
    '1.3.6.1.4.1.311.10.3.3': 'Microsoft 服务器加密',
    '1.3.6.1.4.1.311.10.3.4': 'Microsoft 加密文件系统',
    '1.3.6.1.4.1.311.20.2.2': 'Microsoft 智能卡登录',
    '1.3.6.1.4.1.311.10.3.12': 'Microsoft 文档签名',
    '0.9.2342.19200300.100.1.3': '备用名称中的邮箱地址',
  };
  const results = oids.map((oid) => oidMap[oid] || oid);
  return results.filter((item, index) => results.indexOf(item) === index);
}

// Days from a certificate's issue to its expiry
const lifetime = ({ valid_from, valid_to }: any) =>
  Math.round((Date.parse(valid_to) - Date.parse(valid_from)) / 86_400_000);

// Key type and size, like "RSA 2048-bit" or "EC 256-bit (P-256)"
const describeKey = ({ bits, modulus, asn1Curve, nistCurve }: any) => {
  if (!bits) return '';
  if (modulus) return `RSA ${bits}-bit`;
  const curve = nistCurve || asn1Curve;
  return curve ? `EC ${bits}-bit (${curve})` : `${bits}-bit`;
};

const SslCertCard = (props: { data: any; title: string; actionButtons: any }): JSX.Element => {
  const sslCert = props.data;
  const { subject, issuer, fingerprint, serialNumber, valid_to, valid_from, ext_key_usage } =
    sslCert;
  const key = describeKey(sslCert);
  const days = lifetime(sslCert);
  const altNames = (sslCert.subjectaltname || '')
    .split(', ')
    .map((name: string) => name.replace(/^[^:]+:/, ''))
    .filter(Boolean);
  return (
    <Card heading={props.title} actionButtons={props.actionButtons}>
      {subject && <Row lbl="证书主体" val={subject.CN} />}
      {issuer?.O && <Row lbl="签发机构" val={issuer.O} />}
      {typeof sslCert.isValid === 'boolean' && (
        <Row
          lbl="是否受信任"
          val={sslCert.isValid}
          no={`否（${sslCert.authError}）`}
          reason={REASONS[sslCert.authError]}
          term="certificate-trust"
        />
      )}
      {key && <Row lbl="公钥" val={key} />}
      {valid_to && (
        <Row
          lbl="到期日期"
          val={valid_to}
          term="certificate-expiry"
          {...fromFinding(checkExpiry(valid_to))}
        />
      )}
      {valid_from && <Row lbl="签发日期" val={valid_from} />}
      {days > 0 && <Row lbl="有效天数" val={`${days} 天`} />}
      {serialNumber && <Row lbl="序列号" val={serialNumber} />}
      {fingerprint && <Row lbl="证书指纹" val={fingerprint} />}
      {altNames.length > 0 && (
        <ExpandableRow
          lbl="备用域名"
          val={altNames.length}
          rowList={altNames.map((name: string) => ({ lbl: name }))}
        />
      )}
      {sslCert.chain?.length > 0 && <ListRow title="证书链" list={sslCert.chain} />}
      {ext_key_usage && <ListRow title="扩展密钥用途" list={getExtendedKeyUsage(ext_key_usage)} />}
    </Card>
  );
};

export default SslCertCard;
