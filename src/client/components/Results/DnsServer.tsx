import { Card } from 'client/components/Form/Card';
import Row, { Section } from 'client/components/Form/Row';

const DnsServerCard = (props: { data: any; title: string; actionButtons: any }): JSX.Element => {
  const dnsSecurity = props.data;
  return (
    <Card heading={props.title} actionButtons={props.actionButtons}>
      {dnsSecurity.zone && <Row lbl="DNS 区域" val={dnsSecurity.zone} />}
      {dnsSecurity.dns.map((dns: any, index: number) => (
        <Section key={index} title={dnsSecurity.dns.length > 1 && `DNS 服务器 ${index + 1}`}>
          <Row lbl="主机名" val={dns.hostname} />
          {dns.address && <Row lbl="IP 地址" val={dns.address} />}
        </Section>
      ))}
    </Card>
  );
};

export default DnsServerCard;
