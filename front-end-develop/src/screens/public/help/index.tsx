import { Link } from "react-router-dom";
import { usePublicLanguage } from "@/context/PublicLanguageContext";
import StaticContentSections, {
  StaticContentAside,
} from "@/components/public/StaticContentSections";
import { platformConfig } from "@/config/platform.config";

export default function Help() {
  const { content } = usePublicLanguage();

  return (
    <StaticContentSections
      page={content.help}
      breadcrumbLabel={content.common.nav.help}
    >
      <StaticContentAside>
        <h2>Contact and assisted service</h2>
        <div className="public-grid public-grid-2">
          <div className="public-card">
            <h3>Visit a service centre</h3>
            <p>
              Assisted service is available for anyone who prefers in-person
              support.
            </p>
            <Link className="public-card-link" to="/service-centres">
              {content.common.nav.serviceCentres}
            </Link>
          </div>
          <div className="public-card">
            <h3>Call the helpline</h3>
            {platformConfig.contact.callCenterNumber && (
              <p>{platformConfig.contact.callCenterNumber}</p>
            )}
            {platformConfig.contact.hoursOfOperation && (
              <p className="public-form-hint">
                {platformConfig.contact.hoursOfOperation}
              </p>
            )}
            <Link className="public-card-link" to="/complaints">
              {content.common.footer.complaints}
            </Link>
          </div>
        </div>
      </StaticContentAside>
    </StaticContentSections>
  );
}
