import Icon from "@/components/icon";

export type WizardStep = { key: string; label: string };

export type WizardShellProps = {
  steps: WizardStep[];
  currentStepIndex: number;
  furthestStepIndex: number;
  onStepClick?: (index: number) => void;
  summary: React.ReactNode;
  autosaveState?: "idle" | "saving" | "saved";
  children: React.ReactNode;
  actions: React.ReactNode;
};

/** Shared stepper + sticky summary + autosave indicator for both the 4-step
 * notification wizard and the 8-step registration wizard (spec §8). On
 * mobile the side stepper collapses to a compact horizontal progress strip
 * and the summary stops being sticky, per spec §8's responsive requirements. */
export default function WizardShell({
  steps,
  currentStepIndex,
  furthestStepIndex,
  onStepClick,
  summary,
  autosaveState,
  children,
  actions,
}: WizardShellProps) {
  return (
    <div className="crvs-wizard">
      <div className="crvs-wizard-progress-compact" role="list" aria-label="Wizard progress">
        {steps.map((step, index) => (
          <span
            key={step.key}
            role="listitem"
            className={`crvs-wizard-step ${index === currentStepIndex ? "is-active" : ""} ${
              index < currentStepIndex ? "is-complete" : ""
            }`}
            style={{ flexShrink: 0 }}
          >
            <span className="crvs-wizard-step-index">
              {index < currentStepIndex ? <Icon name="check" /> : index + 1}
            </span>
            {step.label}
          </span>
        ))}
      </div>

      <div className="crvs-wizard-layout">
        <nav className="crvs-wizard-steps" aria-label="Wizard steps">
          {steps.map((step, index) => {
            const reachable = index <= furthestStepIndex && !!onStepClick;
            return (
              <button
                type="button"
                key={step.key}
                onClick={() => reachable && onStepClick!(index)}
                disabled={!reachable}
                className={`crvs-wizard-step ${index === currentStepIndex ? "is-active" : ""} ${
                  index < currentStepIndex ? "is-complete" : ""
                }`}
                style={{ textAlign: "left", background: "none", border: "none", cursor: reachable ? "pointer" : "default" }}
              >
                <span className="crvs-wizard-step-index">
                  {index < currentStepIndex ? <Icon name="check" /> : index + 1}
                </span>
                {step.label}
              </button>
            );
          })}
        </nav>

        <div className="crvs-wizard-main">
          {autosaveState && (
            <div className="crvs-wizard-autosave" role="status" aria-live="polite">
              <Icon name={autosaveState === "saving" ? "sync" : "cloud_done"} />
              {autosaveState === "saving" ? "Saving…" : "Draft saved"}
            </div>
          )}
          {children}
        </div>

        <aside className="crvs-wizard-summary" aria-label="Application summary">
          {summary}
        </aside>
      </div>

      <div className="crvs-wizard-actions">{actions}</div>
    </div>
  );
}
