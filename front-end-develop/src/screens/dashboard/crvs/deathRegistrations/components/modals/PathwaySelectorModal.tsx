import Modal from "@/components/Modal";
import Icon from "@/components/icon";
import { DeathReportingPathway } from "@/domain/crvs/types";
import { PATHWAY_LABELS } from "../../../deathShared";

const PATHWAY_DESCRIPTIONS: Record<DeathReportingPathway, string> = {
  HEALTH_FACILITY: "Death occurred at a health facility with medical certification available.",
  COMMUNITY: "Death occurred outside a facility — declarant report, witnesses, and evidence establish the case.",
  LATE: "The death is being reported after the standard filing deadline.",
  MEDICO_LEGAL: "Circumstances require restricted, authorized review before registration.",
  UNIDENTIFIED: "The deceased's identity is not yet known.",
};

const PATHWAY_ICONS: Record<DeathReportingPathway, string> = {
  HEALTH_FACILITY: "local_hospital",
  COMMUNITY: "groups",
  LATE: "schedule",
  MEDICO_LEGAL: "gavel",
  UNIDENTIFIED: "person_search",
};

/** "Select reporting pathway" modal (spec §8 / §5 step 1) — the wizard's
 * initial pathway choice, which drives evidence/witness requirements and
 * review routing for the rest of the case (crvsPolicyConfig). */
export default function PathwaySelectorModal({
  show,
  onClose,
  onSelect,
}: {
  show: boolean;
  onClose: () => void;
  onSelect: (pathway: DeathReportingPathway) => void;
}) {
  return (
    <Modal show={show} handleClose={onClose} title="Select reporting pathway" size="sm" testId="pathway-selector-modal">
      <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
        {(Object.keys(PATHWAY_LABELS) as DeathReportingPathway[]).map((pathway) => (
          <button
            key={pathway}
            type="button"
            className="crvs-case-card"
            style={{ textAlign: "left", display: "flex", gap: 12, alignItems: "flex-start" }}
            onClick={() => onSelect(pathway)}
            data-testid={`pathway-option-${pathway}`}
          >
            <Icon name={PATHWAY_ICONS[pathway]} />
            <div>
              <strong>{PATHWAY_LABELS[pathway]}</strong>
              <p className="crvs-form-hint" style={{ margin: "2px 0 0" }}>{PATHWAY_DESCRIPTIONS[pathway]}</p>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
}
