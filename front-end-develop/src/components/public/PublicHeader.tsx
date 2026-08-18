import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { platformConfig } from "@/config/platform.config";
import { usePublicLanguage } from "@/context/PublicLanguageContext";
import LanguageSelector from "./LanguageSelector";

export default function PublicHeader({ overlay }: { overlay?: boolean }) {
  const { content } = usePublicLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = content.common.nav;

  const links = [
    { label: nav.home, href: "/" },
    { label: nav.digitalIdentity, href: "/digital-identity" },
    { label: nav.civilRegistration, href: "/civil-registration" },
    { label: nav.certificates, href: "/certificates" },
    { label: nav.track, href: "/track" },
    { label: nav.verify, href: "/verify" },
    { label: nav.serviceCentres, href: "/service-centres" },
    { label: nav.help, href: "/help" },
  ];

  return (
    <header
      className={`public-header ${overlay ? "public-header-overlay" : ""}`}
    >
      <div className="public-header-inner">
        <Link to="/" className="public-logo-link">
          <img src={platformConfig.logo.src} alt={platformConfig.logo.alt} />
        </Link>

        <nav className="public-nav" aria-label={nav.menu}>
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <NavLink
                  to={link.href}
                  end={link.href === "/"}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="public-header-actions">
          <LanguageSelector />
          {platformConfig.featureFlags.enableStaffSignInLink && (
            <Link to="/staff/sign-in" className="public-staff-link">
              {nav.staffSignIn}
            </Link>
          )}
          <Link to="/track" className="public-header-cta">
            {nav.track}
          </Link>
          <button
            type="button"
            className="public-menu-toggle"
            aria-expanded={mobileOpen}
            aria-controls="public-mobile-nav"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {nav.menu}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          id="public-mobile-nav"
          className="public-mobile-nav"
          aria-label={nav.menu}
        >
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <Link to={link.href} onClick={() => setMobileOpen(false)}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
