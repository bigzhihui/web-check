import { Card } from 'client/components/Form/Card';
import Row from 'client/components/Form/Row';
import colors from 'client/styles/colors';
import { REQUIRED } from 'client/analysis/rules/social-tags';

const cardStyles = `
  .banner-image img {
    width: 100%;
    border-radius: 4px;
    margin: 0.5rem 0;
  }
  .color-field {
    border-radius: 4px;
    &:hover {
      color: ${colors.primary};
    }
  }
`;

const OgBanner = ({ ogImage, ogUrl }: { ogImage: string; ogUrl?: string }): JSX.Element => {
  const urlCover = ogImage.startsWith('/') && ogUrl ? `${ogUrl}${ogImage}` : ogImage;
  return (
    <div className="banner-image">
      <img src={urlCover} alt="网站分享预览图" />
    </div>
  );
};

const SocialTagsCard = (props: { data: any; title: string; actionButtons: any }): JSX.Element => {
  const tags = props.data;
  return (
    <Card heading={props.title} actionButtons={props.actionButtons} styles={cardStyles}>
      {tags.title && <Row lbl="页面标题" val={tags.title} />}
      {tags.description && <Row lbl="页面描述" val={tags.description} />}
      {tags.keywords && <Row lbl="关键词" val={tags.keywords} />}
      {tags.canonicalUrl && <Row lbl="规范网址" val={tags.canonicalUrl} />}
      {REQUIRED.map(([key, label]) => (
        <Row
          key={key}
          lbl={label}
          val={tags[key] || '未设置'}
          status={tags[key] ? 'pass' : 'warning'}
          term={key === 'twitterCard' ? 'twitter-card' : 'open-graph'}
        />
      ))}
      {tags.themeColor && (
        <Row>
          <span className="lbl">主题颜色</span>
          <span className="val color-field" style={{ background: tags.themeColor }}>
            {tags.themeColor}
          </span>
        </Row>
      )}
      {tags.twitterSite && (
        <Row
          lbl="X 账号"
          val={tags.xHandle ? `@${tags.xHandle}` : tags.twitterSite}
          link={tags.xHandle && `https://x.com/${tags.xHandle}`}
        />
      )}
      {tags.author && <Row lbl="作者" val={tags.author} />}
      {tags.publisher && <Row lbl="发布者" val={tags.publisher} />}
      {tags.generator && <Row lbl="生成工具" val={tags.generator} />}
      {tags.ogImage && <OgBanner ogImage={tags.ogImage} ogUrl={tags.ogUrl} />}
    </Card>
  );
};

export default SocialTagsCard;
