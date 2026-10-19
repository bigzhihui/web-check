import styled from '@emotion/styled';
import colors from 'client/styles/colors';
import { Card } from 'client/components/Form/Card';
import type { CategoryId } from '@/data/categories';

const ResourceListOuter = styled.ul`
  list-style: none;
  margin: 0;
  padding: 1rem;
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 19rem), 1fr));
  li a.resource-wrap {
    display: flex;
    flex-direction: column;
    align-items: start;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    background: ${colors.background};
    border-radius: 8px;
    text-decoration: none;
    color: ${colors.textColor};
    height: 100%;

    transition: all 0.2s ease-in-out;
    cursor: pointer;
    border: 1px solid transparent;
    border-radius: 0.25rem;
    font-family: var(--font-mono);
    box-sizing: border-box;
    width: -moz-available;
    &:hover {
      border-color: ${colors.primary};
      a {
        opacity: 1;
      }
    }
  }
  img {
    width: 2.5rem;
    border-radius: 4px;
    margin: 0.25rem 0.1rem 0.1rem 0.1rem;
  }
  p,
  a {
    margin: 0;
  }
  .resource-link {
    color: ${colors.primary};
    opacity: 0.75;
    font-size: 0.9rem;
    transition: all 0.2s ease-in-out;
    text-decoration: underline;
    cursor: pointer;
  }
  .resource-title {
    font-weight: bold;
  }
  .resource-lower {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .resource-details {
    max-width: 20rem;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    .resource-description {
      color: ${colors.textColorSecondary};
      font-size: 0.9rem;
    }
  }
`;

const Note = styled.small`
  margin-top: 1rem;
  opacity: 0.5;
  display: block;
  a {
    color: ${colors.primary};
  }
`;

const CardStyles = `
  margin: 0 auto;
  width: var(--page-width);
  position: relative;
  transition: all 0.2s ease-in-out;
  max-height: 100%;
`;

interface Resource {
  title: string;
  link: string;
  icon: string;
  description: string;
  searchLink?: string;
  categories: CategoryId[];
}

const resources: Resource[] = [
  {
    title: 'Hudson Rock',
    link: 'https://hudsonrock.com/free-tools/?=webcheck',
    icon: 'https://pixelflare.cc/alicia/icons/hudson-rock.png/w128',
    description: '查询与域名、邮箱相关的窃密木马感染记录',
    categories: ['security'],
  },
  {
    title: 'SSL Labs Test',
    link: 'https://ssllabs.com/ssltest/analyze.html',
    icon: 'https://pixelflare.cc/alicia/icons/qualys-ssl-labs.png/w128',
    description: '分析服务器的 SSL/TLS 配置并给出评级',
    searchLink: 'https://www.ssllabs.com/ssltest/analyze.html?d={DOMAIN}',
    categories: ['security', 'server'],
  },
  {
    title: 'Virus Total',
    link: 'https://virustotal.com',
    icon: 'https://pixelflare.cc/alicia/icons/virustotal.png/w128',
    description: '使用多个安全引擎查询域名或网址风险',
    searchLink: 'https://www.virustotal.com/gui/domain/{DOMAIN}',
    categories: ['security'],
  },
  {
    title: 'Shodan',
    link: 'https://shodan.io/',
    icon: 'https://pixelflare.cc/alicia/icons/shodan.png/w128',
    description: '搜索互联网设备与公开服务信息',
    searchLink: 'https://www.shodan.io/search/report?query={DOMAIN}',
    categories: ['security', 'server'],
  },
  {
    title: 'Archive',
    link: 'https://archive.org/',
    icon: 'https://pixelflare.cc/alicia/icons/internet-archive.png/w128',
    description: '通过互联网档案馆查看网站的历史快照',
    searchLink: 'https://web.archive.org/web/*/{URL}',
    categories: ['seo'],
  },
  {
    title: 'URLScan',
    link: 'https://urlscan.io/',
    icon: 'https://pixelflare.cc/alicia/icons/urlscan.png/w128',
    description: '查询网址扫描记录与页面信息',
    searchLink: 'https://urlscan.io/domain/{DOMAIN}',
    categories: ['security', 'privacy'],
  },
  {
    title: 'Sucuri SiteCheck',
    link: 'https://sitecheck.sucuri.net/',
    icon: 'https://pixelflare.cc/alicia/icons/sucuri.png/w128',
    description: '检查网址是否涉及黑名单或已知威胁',
    searchLink: 'https://sitecheck.sucuri.net/results/{DOMAIN}',
    categories: ['security'],
  },
  {
    title: 'Domain Tools',
    link: 'https://whois.domaintools.com/',
    icon: 'https://pixelflare.cc/alicia/icons/domaintools.png/w128',
    description: '查询域名的 WHOIS 注册信息',
    searchLink: 'https://whois.domaintools.com/{DOMAIN}',
    categories: ['domain', 'privacy'],
  },
  {
    title: 'NS Lookup',
    link: 'https://nslookup.io/',
    icon: 'https://pixelflare.cc/alicia/icons/nslookup.png/w128',
    description: '查询域名的 DNS 记录',
    searchLink: 'https://www.nslookup.io/domains/{DOMAIN}/dns-records/',
    categories: ['domain', 'email'],
  },
  {
    title: 'DNS Checker',
    link: 'https://dnschecker.org/',
    icon: 'https://pixelflare.cc/alicia/icons/dns-checker.png/w128',
    description: '检查不同地区服务器上的 DNS 解析情况',
    searchLink: 'https://dnschecker.org/#A/{DOMAIN}',
    categories: ['domain'],
  },
  {
    title: 'Censys',
    link: 'https://search.censys.io/',
    icon: 'https://pixelflare.cc/alicia/icons/censys.png/w128',
    description: '查询与域名关联的主机和公开服务',
    searchLink: 'https://search.censys.io/search?resource=hosts&q={DOMAIN}',
    categories: ['security', 'server'],
  },
  {
    title: 'Page Speed Insights',
    link: 'https://developers.google.com/speed/pagespeed/insights/',
    icon: 'https://pixelflare.cc/alicia/icons/page-speed-insights.png/w128',
    description: '检查手机和桌面页面的性能、无障碍与 SEO',
    searchLink: 'https://developers.google.com/speed/pagespeed/insights/?url={URL}',
    categories: ['performance', 'seo'],
  },
  {
    title: 'Built With',
    link: 'https://builtwith.com/',
    icon: 'https://pixelflare.cc/alicia/icons/built-with.png/w128',
    description: '查看网站使用的技术与服务',
    searchLink: 'https://builtwith.com/{DOMAIN}',
    categories: ['server', 'privacy'],
  },
  {
    title: 'DNS Dumpster',
    link: 'https://dnsdumpster.com/',
    icon: 'https://pixelflare.cc/alicia/icons/dnsdumpster.png/w128',
    description: '通过 DNS 记录查看域名关联的主机与子域名',
    categories: ['domain', 'security'],
  },
  {
    title: 'BGP Tools',
    link: 'https://bgp.tools/',
    icon: 'https://pixelflare.cc/alicia/icons/bgp-tools.png/w128',
    description: '查询 ASN、IP 网段或域名的实时 BGP 信息',
    searchLink: 'https://bgp.tools/dns/{DOMAIN}',
    categories: ['server', 'domain'],
  },
  {
    title: 'Similar Web',
    link: 'https://similarweb.com/',
    icon: 'https://pixelflare.cc/alicia/icons/similar-web.png/w128',
    description: '查看网站访问量与用户参与情况的估算数据',
    searchLink: 'https://similarweb.com/website/{DOMAIN}/',
    categories: ['seo'],
  },
  {
    title: 'Blacklist Checker',
    link: 'https://blacklistchecker.com/',
    icon: 'https://pixelflare.cc/alicia/icons/black-list-checker.png/w128',
    description: '查询域名、IP 或邮箱是否出现在常见黑名单中',
    searchLink: 'https://blacklistchecker.com/check?input={DOMAIN}',
    categories: ['security', 'email'],
  },
  {
    title: 'Cloudflare Radar',
    link: 'https://radar.cloudflare.com/',
    icon: 'https://pixelflare.cc/alicia/icons/cloudflare.png/w128',
    description: '通过 Cloudflare 查看域名的流量来源等信息',
    searchLink: 'https://radar.cloudflare.com/domains/domain/{DOMAIN}',
    categories: ['seo'],
  },
  {
    title: 'Mozilla HTTP Observatory',
    link: 'https://developer.mozilla.org/en-US/observatory',
    icon: 'https://pixelflare.cc/alicia/icons/mozilla.png/w128',
    description: '分析 HTTP 安全响应头与配置，评估网站安全情况',
    searchLink: 'https://developer.mozilla.org/en-US/observatory/analyze?host={DOMAIN}',
    categories: ['security', 'privacy'],
  },
  {
    title: 'AbuseIPDB',
    link: 'https://abuseipdb.com/',
    icon: 'https://pixelflare.cc/alicia/icons/abuseipdb.png/w128',
    description: '查询域名或 IP 是否有滥用行为举报记录',
    searchLink: 'https://www.abuseipdb.com/check?query={DOMAIN}',
    categories: ['security', 'server'],
  },
  {
    title: 'IBM X-Force Exchange',
    link: 'https://exchange.xforce.ibmcloud.com/',
    icon: 'https://pixelflare.cc/alicia/icons/ibm-x-force-exchange.png/w128',
    description: '查询人工与自动化系统共享的威胁情报',
    searchLink: 'https://exchange.xforce.ibmcloud.com/url/{URL_ENCODED}',
    categories: ['security'],
  },
  {
    title: 'URLVoid',
    link: 'https://urlvoid.com/',
    icon: 'https://pixelflare.cc/alicia/icons/urlvoid.png/w128',
    description: '综合多个黑名单引擎与信誉服务查询网站风险',
    searchLink: 'https://urlvoid.com/scan/{DOMAIN}',
    categories: ['security'],
  },
  {
    title: 'URLhaus',
    link: 'https://urlhaus.abuse.ch/',
    icon: 'https://pixelflare.cc/alicia/icons/urlhaus.png/w128',
    description: '查询网址是否出现在 URLhaus 恶意软件网址库中',
    searchLink: 'https://urlhaus.abuse.ch/browse.php?search={URL_ENCODED}',
    categories: ['security'],
  },
  {
    title: 'ANY.RUN',
    link: 'https://any.run/',
    icon: 'https://pixelflare.cc/alicia/icons/anyrun.png/w128',
    description: '使用交互式沙箱分析恶意软件与网页',
    categories: ['security'],
  },
  {
    title: 'Blacklight',
    link: 'https://themarkup.org/blacklight',
    icon: 'https://pixelflare.cc/alicia/icons/the-markup.png/w128',
    description: '检查网站使用的跟踪器、Cookie 与浏览器指纹技术',
    searchLink: 'https://themarkup.org/blacklight?url={DOMAIN}',
    categories: ['privacy', 'security'],
  },
];

const makeLink = (resource: Resource, scanUrl: string | undefined): string => {
  return scanUrl && resource.searchLink
    ? resource.searchLink
        .replaceAll('{URL}', scanUrl.replace(/(https?:\/\/)?/i, ''))
        .replaceAll(
          '{URL_ENCODED}',
          encodeURIComponent(scanUrl.replace(/(https?:\/\/)?/i, '')).replace(
            /['\.*]/g,
            (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
          ),
        )
        .replaceAll(
          '{DOMAIN}',
          scanUrl.replace(/(https?:\/\/)?(www.)?/i, '').replace(/(\/.*)/i, ''),
        )
    : resource.link;
};

const AdditionalResources = ({
  url,
  categories,
}: {
  url?: string;
  categories?: CategoryId[];
}): JSX.Element | null => {
  const shown = categories
    ? resources.filter((r) => r.categories.some((c) => categories.includes(c)))
    : resources;
  if (!shown.length) return null;
  return (
    <Card heading="第三方检测工具" styles={CardStyles}>
      <ResourceListOuter>
        {shown.map((resource, index) => {
          return (
            <li key={index}>
              <a
                className="resource-wrap"
                target="_blank"
                rel="noreferrer"
                href={makeLink(resource, url)}
              >
                <p className="resource-title">{resource.title}</p>
                <span className="resource-link" title={`打开 ${resource.title}`}>
                  {new URL(resource.link).hostname}
                </span>
                <div className="resource-lower">
                  <img src={resource.icon} alt="" />
                  <div className="resource-details">
                    <p className="resource-description">{resource.description}</p>
                  </div>
                </div>
              </a>
            </li>
          );
        })}
      </ResourceListOuter>
      <Note>
        点击卡片可在新标签页打开第三方工具，部分查询会自动填入当前域名。
        这些服务由各自的网站提供，功能、收费与使用规则以对应网站为准。
      </Note>
    </Card>
  );
};

export default AdditionalResources;
