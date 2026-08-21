import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { platformConfig } from "@/config/platform.config";
import { usePublicLanguage } from "@/context/PublicLanguageContext";
import LanguageSelector from "./LanguageSelector";

export default function PublicHeader() {
  const { content } = usePublicLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement | null>(null);
  const mobileNavRef = useRef<HTMLElement | null>(null);
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock background scroll, trap focus, close on Escape, and return focus
  // to the toggle button when the mobile panel closes.
  useEffect(() => {
    if (!mobileOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const getFocusable = () =>
      mobileNavRef.current
        ? Array.from(
            mobileNavRef.current.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled])'
            )
          )
        : [];

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const focusable = getFocusable();
    focusable[0]?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      menuToggleRef.current?.focus();
    };
  }, [mobileOpen]);

  return (
    <header className={`public-header ${scrolled ? "is-scrolled" : ""}`.trim()}>
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
          <button
            ref={menuToggleRef}
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
          ref={mobileNavRef}
        >
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <NavLink
                  to={link.href}
                  end={link.href === "/"}
                  className={({ isActive }) => (isActive ? "active" : "")}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <hr className="public-mobile-nav-divider" />
          <div className="public-mobile-nav-actions">
            {platformConfig.featureFlags.enableStaffSignInLink && (
              <Link
                to="/staff/sign-in"
                className="public-btn public-btn-secondary"
                onClick={() => setMobileOpen(false)}
              >
                {nav.staffSignIn}
              </Link>
            )}
            <Link
              to="/track"
              className="public-btn public-btn-primary"
              onClick={() => setMobileOpen(false)}
            >
              {nav.track}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
