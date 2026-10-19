import { Card, Note } from 'client/components/Form/Card';
import Row, { Section } from 'client/components/Form/Row';
import { fromFinding } from 'client/components/misc/Icon';
import { getPath } from 'client/utils/result-processor';
import { checkContact, checkExpires, getField } from 'client/analysis/rules/security-txt';

const SecurityTxtCard = (props: { data: any; title: string; actionButtons: any }): JSX.Element => {
  const { isPresent, foundIn, isPgpSigned, fields = {}, content } = props.data;
  const contact = checkContact(fields);
  const expires = checkExpires(fields);
  return (
    <Card heading={props.title} actionButtons={props.actionButtons}>
      <Row
        lbl="是否存在"
        val={!!isPresent}
        status={isPresent ? 'pass' : 'warning'}
        term="security-txt"
      />
      {isPresent && (
        <>
          <Row lbl="文件位置" val={foundIn} />
          <Row
            lbl="是否有 PGP 签名"
            val={!!isPgpSigned}
            status={isPgpSigned ? 'pass' : 'info'}
            term="security-txt-signature"
          />
          {contact && (
            <Row
              lbl="联系方式"
              val="未设置"
              term="security-txt-contact"
              {...fromFinding(contact)}
            />
          )}
          {!getField(fields, 'expires') && (
            <Row
              lbl="到期日期"
              val="未设置"
              term="security-txt-expires"
              {...fromFinding(expires)}
            />
          )}
          {Object.entries(fields).map(([field, value]: [string, any]) => {
            const isLink = value.includes('http');
            return (
              <Row
                key={field}
                lbl={field}
                val={isLink ? getPath(value) : value}
                link={isLink ? value : undefined}
                term="security-txt-expires"
                {...fromFinding(field.toLowerCase() === 'expires' ? expires : null)}
              />
            );
          })}
          <Section title="查看完整原文" collapsible>
            <Row plaintext={content} />
          </Section>
        </>
      )}
      {!isPresent && <Note>security.txt 用于告知安全研究人员如何联系网站并报告安全问题。</Note>}
    </Card>
  );
};

export default SecurityTxtCard;
