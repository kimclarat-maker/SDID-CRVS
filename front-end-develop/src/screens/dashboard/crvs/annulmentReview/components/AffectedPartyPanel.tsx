// One reusable panel for both affected parties (spec: build ONE component,
// don't duplicate JSX between the FIRST_PARTY / SECOND_PARTY tabs).
import StatusBadge from "../../components/StatusBadge";
import { AffectedParty } from "@/domain/crvs/types";
import { affectedPartyDisplayName, formatDate, maskDocumentNumber, IDENTITY_MATCH_CONFIDENCE_LABELS, DOCUMENT_TYPE_LABELS } from "../../annulmentShared";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default function AffectedPartyPanel({ party, label }: { party: AffectedParty; label: string }) {
  return (
    <dl className="review-readonly-fields">
      <Field label="Name" value={affectedPartyDisplayName(party)} />
      <Field label="Role" value={label} />
      <Field label="Sex" value={party.sex} />
      <Field label="Date of birth" value={formatDate(party.dateOfBirth)} />
      <Field label="Nationality" value={party.nationality || "—"} />
      <Field label="Document" value={`${DOCUMENT_TYPE_LABELS[party.documentType || "NONE"]} · ${maskDocumentNumber(party.documentNumber)}`} />
      <Field label="NIN" value={maskDocumentNumber(party.nin)} />
      <Field label="Civil status on record" value={party.currentCivilStatus || "—"} />
      <Field label="Identity match confidence" value={IDENTITY_MATCH_CONFIDENCE_LABELS[party.identityMatchConfidence]} />
      <Field label="Identity verification" value={<StatusBadge kind="verification" status={party.identityVerification} />} />
      <Field label="Linked to selected marriage" value={party.linkedToSelectedMarriage ? "Yes" : "Not linked"} />
      <Field label="Phone" value={party.phone || "—"} />
      <Field label="Email" value={party.email || "—"} />
    </dl>
  );
}
