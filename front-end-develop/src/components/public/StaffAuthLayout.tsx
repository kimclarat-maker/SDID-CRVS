import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { platformConfig } from "@/config/platform.config";
import PublicLayout from "./PublicLayout";
import Icon from "@/components/icon";
import "./staffAuth.css";

const TRUST_POINTS = [
  { icon: "admin_panel_settings", label: "Role-controlled access" },
  { icon: "history_edu", label: "Auditable staff actions" },
  { icon: "verified_user", label: "Secure identity verification" },
];

/**
 * Wraps the (unmodified) staff Login component in the public site's chrome —
 * reuses PublicLayout as-is (header/footer/skip-link/scroll-to-top) rather
 * than re-implementing it, and adds the two-column info/auth panel the
 * redesign spec asks for around {children}. Login's own business logic
 * (real/demo/MFA auth) is untouched; this only supplies presentation.
 */
export default function StaffAuthLayout({ children }: { children: ReactNode }) {
  return (
    <PublicLayout>
      <div className="staff-auth-page public-container">
        <div className="staff-auth-panel">
          <div className="staff-auth-info">
            <p className="staff-auth-eyebrow public-eyebrow-label">Secure staff access</p>
            <h1 className="staff-auth-info-heading">
              Sign in to {platformConfig.platformShortName || "SDID–CRVS"}
            </h1>
            <p className="staff-auth-info-copy">
              What you can see and do here depends on your assigned workspace
              and role. Every action staff take is recorded against their
              account.
            </p>
            <ul className="staff-auth-trust-list">
              {TRUST_POINTS.map((point) => (
                <li key={point.label} className="staff-auth-trust-item">
                  <span className="staff-auth-trust-icon" aria-hidden="true">
                    <Icon name={point.icon} styles={{ fontSize: 20 }} />
                  </span>
                  {point.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="staff-auth-form-panel">
            <div className="staff-auth-intro">
              <h2 className="staff-auth-heading">Staff sign in</h2>
              <p className="staff-auth-subtitle">
                Sign in with your {platformConfig.platformName} staff account to
                access your assigned workspace.
              </p>
            </div>

            {children}

            <Link to="/" className="staff-auth-back-link">
              <Icon name="arrow_back" styles={{ fontSize: 18 }} />
              Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
