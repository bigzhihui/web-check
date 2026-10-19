import { Card, Note } from 'client/components/Form/Card';
import Row, { ListRow } from 'client/components/Form/Row';
import { fromFinding } from 'client/components/misc/Icon';
import caaRecords from 'client/analysis/rules/caa-records';

const titles: Record<string, string> = {
  issue: '允许的证书机构',
  issuewild: '允许的通配符证书机构',
  iodef: '违规报告地址',
  contactemail: '联系邮箱',
  contactphone: '联系电话',
};

// Group record values by tag, with the known tags first
const groupByTag = (records: any[]) => {
  const groups: Record<string, string[]> = { issue: [], issuewild: [], iodef: [] };
  for (const { tag, value, critical } of records) {
    groups[tag] = [...(groups[tag] || []), critical ? `${value}（关键记录）` : value];
  }
  return Object.entries(groups).filter(([, values]) => values.length);
};

const CaaRecordsCard = (props: { data: any; title: string; actionButtons: any }): JSX.Element => {
  const { domain, records = [] } = props.data;
  const [finding] = caaRecords(props.data);
  return (
    <Card heading={props.title} actionButtons={props.actionButtons}>
      <Row lbl="域名" val={domain} />
      <Row lbl="CAA 记录数" val={records.length || '无'} term="caa" {...fromFinding(finding)} />
      {groupByTag(records).map(([tag, values]) => (
        <ListRow key={tag} title={titles[tag] || tag} list={values} />
      ))}
      {!records.length && <Note>未设置 CAA 记录，域名未限制可为其签发证书的证书机构。</Note>}
    </Card>
  );
};

export default CaaRecordsCard;
