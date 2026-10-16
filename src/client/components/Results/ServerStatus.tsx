import { Card } from 'client/components/Form/Card';
import Row from 'client/components/Form/Row';
import { fromFinding } from 'client/components/misc/Icon';
import { checkResponseTime } from 'client/analysis/rules/status';

const STEPS = [
  ['dns', 'DNS 查询'],
  ['connect', 'TCP 连接'],
  ['tls', 'TLS 握手'],
  ['wait', '服务器响应'],
  ['download', '下载'],
];

const ServerStatusCard = (props: { data: any; title: string; actionButtons: any }): JSX.Element => {
  const serverStatus = props.data;
  return (
    <Card heading={props.title} actionButtons={props.actionButtons}>
      <Row lbl="可访问" val={serverStatus.isUp} yes="在线" no="离线" />
      <Row lbl="状态码" val={serverStatus.responseCode} />
      {serverStatus.responseTime && (
        <Row
          lbl="响应耗时"
          val={`${Math.round(serverStatus.responseTime)}ms`}
          term="response-time"
          {...fromFinding(checkResponseTime(serverStatus.responseTime))}
        />
      )}
      {STEPS.map(
        ([key, label]) =>
          serverStatus.timings?.[key] > 0 && (
            <Row key={key} lbl={label} val={`${serverStatus.timings[key]}ms`} />
          ),
      )}
    </Card>
  );
};

export default ServerStatusCard;
