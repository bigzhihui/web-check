import { Card } from 'client/components/Form/Card';
import Row, { ExpandableRow } from 'client/components/Form/Row';
import { getPath } from 'client/utils/result-processor';

// Rows shown when a page is expanded, skipping any the sitemap leaves out
const details = (page: any) =>
  [
    { lbl: '最后修改', val: page.lastmod?.[0] },
    { lbl: '更新频率', val: page.changefreq?.[0] },
    { lbl: '优先级', val: page.priority?.[0] },
  ].filter((row) => row.val);

const SitemapCard = (props: { data: any; title: string; actionButtons: any }): JSX.Element => {
  const pages = props.data.url || props.data.urlset?.url || [];
  const sitemaps = props.data.sitemapindex?.sitemap || [];
  return (
    <Card heading={props.title} actionButtons={props.actionButtons}>
      {pages.map((page: any, index: number) => (
        <ExpandableRow key={index} lbl={getPath(page.loc[0])} rowList={details(page)} />
      ))}
      {sitemaps.length > 0 && <p>该网站返回了站点地图索引，其中包含多个站点地图。</p>}
      {sitemaps.map((sitemap: any, index: number) => (
        <Row key={index}>
          <a href={sitemap.loc[0]}>{getPath(sitemap.loc[0])}</a>
        </Row>
      ))}
    </Card>
  );
};

export default SitemapCard;
