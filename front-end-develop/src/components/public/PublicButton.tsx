import { Link } from "react-router-dom";
import { ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline";

interface PublicButtonProps {
  href: string;
  children: ReactNode;
  variant?: Variant;
  testId?: string;
}

export default function PublicButton({
  href,
  children,
  variant = "primary",
  testId,
}: PublicButtonProps) {
  const isExternal = /^https?:\/\//.test(href);
  const className = `public-btn public-btn-${variant}`;

  if (isExternal) {
    return (
      <a
        href={href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
        data-testid={testId}
      >
        {children}
      </a>
    );
  }

  return (
    <Link to={href} className={className} data-testid={testId}>
      {children}
    </Link>
  );
}
