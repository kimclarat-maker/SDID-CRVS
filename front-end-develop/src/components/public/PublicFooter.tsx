import { Link } from "react-router-dom";
import { platformConfig } from "@/config/platform.config";
import { usePublicLanguage } from "@/context/PublicLanguageContext";

export default function PublicFooter() {
  const { content } = usePublicLanguage();
  const footer = content.common.footer;
  const { contact } = platformConfig;

  return (
    <footer className="public-footer">
      <div className="public-container">
        <div className="public-footer-top">
          <Link to="/" className="public-footer-logo">
            <img src={platformConfig.logo.src} alt="" aria-hidden="true" />
            {platformConfig.platformName}
          </Link>
        </div>

        <div className="public-footer-grid">
          <div>
            <h2>{footer.aboutHeading}</h2>
            <p>{footer.aboutText}</p>
          </div>

          <div>
            <h3>{footer.linksHeading}</h3>
            <ul className="public-footer-links">
              <li>
                <Link to="/digital-identity">
                  {content.common.nav.digitalIdentity}
                </Link>
              </li>
              <li>
                <Link to="/civil-registration">
                  {content.common.nav.civilRegistration}
                </Link>
              </li>
              <li>
                <Link to="/service-centres">
                  {content.common.nav.serviceCentres}
                </Link>
              </li>
              <li>
                <Link to="/help">{content.common.nav.help}</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3>{footer.legalHeading}</h3>
            <ul className="public-footer-links">
              <li>
                <Link to="/privacy">{footer.privacy}</Link>
              </li>
              <li>
                <Link to="/accessibility">{footer.accessibility}</Link>
              </li>
              <li>
                <Link to="/complaints">{footer.complaints}</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3>{footer.contactHeading}</h3>
            <ul className="public-footer-contact">
              {contact.callCenterNumber && (
                <li>
                  <a href={`tel:${contact.callCenterNumber}`}>
                    {contact.callCenterNumber}
                  </a>
                </li>
              )}
              {contact.email && (
                <li>
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </li>
              )}
              {contact.address && <li>{contact.address}</li>}
              {contact.hoursOfOperation && (
                <li>{contact.hoursOfOperation}</li>
              )}
            </ul>
          </div>
        </div>

        <div className="public-footer-bottom">{footer.copyright}</div>
      </div>
    </footer>
  );
}
