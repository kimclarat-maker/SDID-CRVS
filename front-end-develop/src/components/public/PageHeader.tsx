import { Link } from "react-router-dom";
import { ReactNode } from "react";
import Reveal from "./Reveal";

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  breadcrumb?: { label: string; href?: string }[];
  children?: ReactNode;
}

export default function PageHeader({
  title,
  description,
  eyebrow,
  breadcrumb,
  children,
}: PageHeaderProps) {
  return (
    <div className="public-page-header">
      <div className="public-container">
        <Reveal className="public-page-header-content">
          {breadcrumb && breadcrumb.length > 0 && (
            <nav className="public-breadcrumb" aria-label="Breadcrumb">
              {breadcrumb.map((crumb, index) => (
                <span key={crumb.label}>
                  {crumb.href ? (
                    <Link to={crumb.href}>{crumb.label}</Link>
                  ) : (
                    <span aria-current="page">{crumb.label}</span>
                  )}
                  {index < breadcrumb.length - 1 && " / "}
                </span>
              ))}
            </nav>
          )}
          {eyebrow && (
            <p className="public-eyebrow-label public-page-header-eyebrow">
              {eyebrow}
            </p>
          )}
          <h1>{title}</h1>
          {description && <p>{description}</p>}
          {children && (
            <div className="public-page-header-actions">{children}</div>
          )}
        </Reveal>
      </div>
    </div>
  );
}
