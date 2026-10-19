import { Card } from 'client/components/Form/Card';
import Row, { Section } from 'client/components/Form/Row';
import { getPath } from 'client/utils/result-processor';

const ContentLinksCard = (props: { data: any; title: string; actionButtons: any }): JSX.Element => {
  const internal: string[] = props.data.internal || [];
  const external: string[] = props.data.external || [];
  return (
    <Card heading={props.title} actionButtons={props.actionButtons}>
      <Section title="链接概况">
        <Row lbl="站内链接数" val={internal.length} />
        <Row lbl="外部链接数" val={external.length} />
      </Section>
      {internal.length > 0 && (
        <Section title="站内链接" collapsible>
          {internal.map((link) => (
            <Row key={link}>
              <a href={link} target="_blank" rel="noreferrer">
                {getPath(link)}
              </a>
            </Row>
          ))}
        </Section>
      )}
      {external.length > 0 && (
        <Section title="外部链接" collapsible>
          {external.map((link) => (
            <Row key={link}>
              <a href={link} target="_blank" rel="noreferrer">
                {link}
              </a>
            </Row>
          ))}
        </Section>
      )}
    </Card>
  );
};

export default ContentLinksCard;
