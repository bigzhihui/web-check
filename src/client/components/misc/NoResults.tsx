import styled from '@emotion/styled';
import colors from 'client/styles/colors';
import { StyledCard } from 'client/components/Form/Card';
import Heading from 'client/components/Form/Heading';

const Wrapper = styled(StyledCard)`
  margin: 0 auto;
  width: var(--page-width);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  h2 {
    margin: 0;
  }
  p {
    margin: 0;
  }
  .target {
    font-family: var(--font-mono);
    background: ${colors.background};
    padding: 0.4rem 0.6rem;
    border-radius: 4px;
    word-break: break-all;
    align-self: flex-start;
    max-width: 100%;
    color: ${colors.textColor};
  }
  .reasons {
    margin: 0;
    padding-left: 1.25rem;
    color: ${colors.textColorSecondary};
    li {
      padding: 0.15rem 0;
    }
  }
  .detail {
    color: ${colors.textColorSecondary};
    font-size: 0.85rem;
    word-break: break-word;
  }
`;

type Kind = 'unreachable' | 'invalid' | 'api-down' | 'disabled' | 'blocked';

const VARIANT: Record<Kind, { title: string; description: string; reasons: string[] }> = {
  unreachable: {
    title: '暂时无法访问该网站',
    description: '未能取得该网站的可用 IP 地址，检测未能完成',
    reasons: [
      '请检查域名拼写和注册状态',
      '目标网站可能暂时不可访问',
      'DNS 解析状态可能影响本次查询',
      '网站防护或网络位置可能影响访问',
    ],
  },
  invalid: {
    title: '地址格式不正确',
    description: '请输入有效的网站域名或 HTTP/HTTPS 地址',
    reasons: [
      '可填写 example.com 或完整的网站地址',
      '请检查拼写和多余字符',
      '地址中不要包含空格或不支持的符号',
    ],
  },
  'api-down': {
    title: '服务暂时不可用',
    description: '多个检测项目未能返回结果，请稍后重试',
    reasons: [
      '服务可能正在维护或触发请求限流',
      '若问题持续，请联系本站反馈',
      '网络或防护设置也可能影响检测请求',
    ],
  },
  blocked: {
    title: '此地址不支持检测',
    description: '本站未提供对此地址的检测',
    reasons: [
      '目标域名或网段可能不在本站支持范围',
      '部分检测项目可能尚未开放',
      '可查阅开源项目的自托管说明',
    ],
  },
  disabled: {
    title: '检测服务已暂停',
    description: '本站检测服务暂时不可用',
    reasons: ['公共服务可能正在维护', '请稍后重试', '开源项目支持自行部署'],
  },
};

interface Props {
  address: string;
  error?: string;
  kind?: Kind;
}

// Surface a friendly explanation when input is invalid or the host is unreachable
const NoResults = ({ address, error, kind = 'unreachable' }: Props): JSX.Element => {
  const { title, description, reasons } = VARIANT[kind];
  return (
    <Wrapper role="alert">
      <Heading as="h2" align="left" color={colors.danger}>
        {title}
      </Heading>
      <p>{description}</p>
      <code className="target">{address}</code>
      <p>Possible reasons:</p>
      <ul className="reasons">
        {reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      {error && (
        <span className="detail">
          {kind === 'blocked' ? 'Reason' : 'Lookup error'}: {error}
        </span>
      )}
    </Wrapper>
  );
};

export default NoResults;
