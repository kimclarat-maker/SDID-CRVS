import { usePublicLanguage } from "@/context/PublicLanguageContext";
import StaticContentSections, {
  StaticContentAside,
} from "@/components/public/StaticContentSections";
import { platformConfig } from "@/config/platform.config";

export default function Complaints() {
  const { content } = usePublicLanguage();

  return (
    <StaticContentSections
      page={content.complaints}
      breadcrumbLabel={content.common.footer.complaints}
    >
      <StaticContentAside>
        <h2>Alternative contact channels</h2>
        <dl className="public-fact-list">
          {platformConfig.contact.callCenterNumber && (
            <div>
              <dt>Call centre</dt>
              <dd>{platformConfig.contact.callCenterNumber}</dd>
            </div>
          )}
          {platformConfig.contact.email && (
            <div>
              <dt>Email</dt>
              <dd>{platformConfig.contact.email}</dd>
            </div>
          )}
          {platformConfig.contact.address && (
            <div>
              <dt>Address</dt>
              <dd>{platformConfig.contact.address}</dd>
            </div>
          )}
          {platformConfig.contact.hoursOfOperation && (
            <div>
              <dt>Hours</dt>
              <dd>{platformConfig.contact.hoursOfOperation}</dd>
            </div>
          )}
        </dl>
      </StaticContentAside>
    </StaticContentSections>
  );
}
