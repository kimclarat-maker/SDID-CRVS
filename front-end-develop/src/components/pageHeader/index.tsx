import { ReactNode } from "react";
import { Link } from "react-router-dom";
import "./styles.css";

type Crumb = { label: string; href?: string };

type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumb?: Crumb[];
  action?: ReactNode;
};

export default function PageHeader({
  title,
  description,
  breadcrumb,
  action,
}: PageHeaderProps) {
  return (
    <div className="dashboard-page-header">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="dashboard-breadcrumb" aria-label="Breadcrumb">
          {breadcrumb.map((crumb, index) => (
            <span key={crumb.label}>
              {crumb.href ? (
                <Link to={crumb.href}>{crumb.label}</Link>
              ) : (
                <span aria-current="page">{crumb.label}</span>
              )}
              {index < breadcrumb.length - 1 && (
                <span className="dashboard-breadcrumb-separator">/</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="dashboard-page-header-row">
        <div>
          <h1 className="dashboard-page-title">{title}</h1>
          {description && (
            <p className="dashboard-page-description">{description}</p>
          )}
        </div>
        {action && <div className="dashboard-page-header-action">{action}</div>}
      </div>
    </div>
  );
}
