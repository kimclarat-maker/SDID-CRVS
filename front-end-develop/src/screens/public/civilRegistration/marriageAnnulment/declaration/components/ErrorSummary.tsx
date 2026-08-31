import { useEffect, useRef } from "react";
import Icon from "@/components/icon";
import { AnnulmentFieldError } from "./wizardTypes";

/** Accessible validation summary (spec §8): announced via role="alert",
 * focused programmatically the moment it appears so keyboard and
 * screen-reader users are taken straight to it, and each entry moves focus
 * to the offending control rather than only scrolling to it. Mirrors
 * divorce's ErrorSummary exactly. */
export default function ErrorSummary({ errors, title = "Check the following before you continue" }: { errors: AnnulmentFieldError[]; title?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errors.length > 0) containerRef.current?.focus();
  }, [errors]);

  if (errors.length === 0) return null;

  const focusField = (fieldId: string) => {
    const target = document.getElementById(fieldId);
    if (!target) return;
    target.scrollIntoView({ block: "center", behavior: "smooth" });
    if (typeof (target as HTMLElement).focus === "function") (target as HTMLElement).focus({ preventScroll: true });
  };

  return (
    <div
      ref={containerRef}
      role="alert"
      tabIndex={-1}
      className="crvs-banner crvs-banner-danger annulment-error-summary"
      aria-labelledby="annulment-error-summary-title"
      data-testid="annulment-error-summary"
    >
      <Icon name="error" />
      <div style={{ flex: 1 }}>
        <strong id="annulment-error-summary-title">{title}</strong>
        <ul style={{ margin: "8px 0 0", paddingInlineStart: 20 }}>
          {errors.map((error) => (
            <li key={`${error.fieldId}-${error.message}`}>
              <button
                type="button"
                className="annulment-error-summary-link"
                onClick={() => focusField(error.fieldId)}
                data-testid={`annulment-error-${error.fieldId}`}
              >
                {error.message}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
