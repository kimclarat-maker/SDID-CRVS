import Icon from "@/components/icon";
import { ReviewSectionStatus } from "@/domain/crvs/types";

const STATUS_META: Record<ReviewSectionStatus, { label: string; tone: string; icon: string }> = {
  NOT_REVIEWED: { label: "Not reviewed", tone: "neutral", icon: "radio_button_unchecked" },
  VERIFIED: { label: "Verified", tone: "success", icon: "check_circle" },
  CORRECTION_REQUIRED: { label: "Correction required", tone: "warning", icon: "edit" },
  EXCEPTION: { label: "Exception", tone: "danger", icon: "report" },
};

export default function SectionReviewCard({
  title,
  status,
  onStatusChange,
  disabled,
  children,
}: {
  title: string;
  status: ReviewSectionStatus;
  onStatusChange?: (status: ReviewSectionStatus) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const meta = STATUS_META[status];
  return (
    <section className="crvs-review-section">
      <div className="crvs-review-section-header">
        <h3 className="crvs-section-title" style={{ margin: 0 }}>{title}</h3>
        <span className={`crvs-status-pill crvs-status-${meta.tone} crvs-status-icon-label`}>
          <Icon name={meta.icon} />
          {meta.label}
        </span>
      </div>
      <div>{children}</div>
      {onStatusChange && (
        <div className="crvs-form-group" style={{ marginTop: 12 }}>
          <label htmlFor={`review-status-${title}`}>Review state</label>
          <select
            id={`review-status-${title}`}
            value={status}
            disabled={disabled}
            onChange={(e) => onStatusChange(e.target.value as ReviewSectionStatus)}
          >
            {(Object.keys(STATUS_META) as ReviewSectionStatus[]).map((key) => (
              <option key={key} value={key}>
                {STATUS_META[key].label}
              </option>
            ))}
          </select>
        </div>
      )}
    </section>
  );
}
