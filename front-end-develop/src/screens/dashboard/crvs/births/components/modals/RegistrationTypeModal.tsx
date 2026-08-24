import Modal from "@/components/Modal";
import Icon from "@/components/icon";
import { BirthRegistrationCase } from "@/domain/crvs/types";

export type DirectRegistrationTypeChoice = {
  sourceType: BirthRegistrationCase["sourceType"];
  occurrenceType: BirthRegistrationCase["occurrenceType"];
  registrationCategory: string;
  label: string;
};

const OPTIONS: (DirectRegistrationTypeChoice & { description: string; icon: string })[] = [
  {
    sourceType: "COMMUNITY",
    occurrenceType: "HOME",
    registrationCategory: "Community birth registration",
    label: "Community birth",
    description: "Birth occurred at home or in the community, outside a health facility. Requires an attestation of birth from a recognized community authority.",
    icon: "home",
  },
  {
    sourceType: "LATE",
    occurrenceType: "FACILITY",
    registrationCategory: "Late birth registration",
    label: "Late birth registration",
    description: "Being reported more than the standard registration window after birth. Requires a delay explanation and late-registration supporting evidence; may route to supervisor review.",
    icon: "schedule",
  },
  {
    sourceType: "ABROAD",
    occurrenceType: "OTHER",
    registrationCategory: "Birth abroad registration",
    label: "Birth abroad",
    description: "Child was born outside the country to an eligible parent. Requires the foreign birth record/consular documentation as evidence.",
    icon: "flight_takeoff",
  },
  {
    sourceType: "OTHER",
    occurrenceType: "OTHER",
    registrationCategory: "Other direct registration",
    label: "Other",
    description: "Any direct registration that doesn't fit the categories above (e.g. transit birth). Extra supporting evidence will be requested case-by-case.",
    icon: "more_horiz",
  },
];

export type RegistrationTypeModalProps = {
  show: boolean;
  onClose: () => void;
  onSelect: (choice: DirectRegistrationTypeChoice) => void;
};

/** Lets the officer choose which kind of direct (non-notification)
 * registration they're starting, each with a short explanation of the
 * extra evidence that category will require (spec: births/new). */
export default function RegistrationTypeModal({ show, onClose, onSelect }: RegistrationTypeModalProps) {
  return (
    <Modal show={show} handleClose={onClose} title="Register a community or late birth" size="lg" testId="registration-type-modal">
      <div style={{ padding: "0 24px 24px" }}>
        <div className="crvs-card-grid">
          {OPTIONS.map((option) => (
            <button
              type="button"
              key={option.sourceType}
              className="crvs-case-card"
              style={{ textAlign: "left", cursor: "pointer" }}
              onClick={() => onSelect(option)}
              data-testid={`registration-type-${option.sourceType}`}
            >
              <div className="crvs-case-card-header">
                <Icon name={option.icon} />
                <strong>{option.label}</strong>
              </div>
              <p className="crvs-form-hint" style={{ margin: 0 }}>{option.description}</p>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
