import { Card } from 'client/components/Form/Card';
import Row, { ExpandableRow } from 'client/components/Form/Row';
import { fromFinding } from 'client/components/misc/Icon';
import robotsTxt, { AI_CRAWLERS, blocksCrawler } from 'client/analysis/rules/robots-txt';

const cardStyles = `
  grid-row: span 2;
`;

const RobotsTxtCard = (props: {
  data: { robots: { lbl: string; val: string }[]; llmsTxt?: boolean };
  title: string;
  actionButtons: any;
}): JSX.Element => {
  const { data } = props;
  const robots = data?.robots || [];
  const crawlers = AI_CRAWLERS.map((name) => ({
    lbl: name,
    val: blocksCrawler(robots, name) ? '已阻止' : '允许',
  }));
  const blocked = crawlers.filter((crawler) => crawler.val === '已阻止').length;
  const [googleBlocked] = robotsTxt(data);

  return (
    <Card heading={props.title} actionButtons={props.actionButtons} styles={cardStyles}>
      {robots.length === 0 && <p>未发现抓取规则。</p>}
      {robots.length > 0 && (
        <>
          <Row
            lbl="Google 搜索抓取"
            val={googleBlocked ? '已阻止' : '允许'}
            term="search-crawling"
            {...fromFinding(googleBlocked)}
          />
          <ExpandableRow
            lbl="已阻止的 AI 爬虫"
            val={`${blocked} / ${crawlers.length}`}
            rowList={crawlers}
          />
        </>
      )}
      {typeof data?.llmsTxt === 'boolean' && (
        <Row lbl="llms.txt" val={data.llmsTxt ? '已发现' : '未发现'} />
      )}
      {robots.map((row, index) => {
        return <Row key={`${row.lbl}-${index}`} lbl={row.lbl} val={row.val} />;
      })}
    </Card>
  );
};

export default RobotsTxtCard;
