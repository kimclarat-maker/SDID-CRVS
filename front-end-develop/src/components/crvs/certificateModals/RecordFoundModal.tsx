import Modal from "@/components/Modal";
import Button from "@/components/button";
import { BirthCertificateRequest } from "@/domain/crvs/types";

export default function RecordFoundModal({
  show,
  onClose,
  request,
  onConfirm,
  onSearchAgain,
  testId = "record-found-modal",
}: {
  show: boolean;
  onClose: () => void;
  request: BirthCertificateRequest | undefined;
  onConfirm: () => void;
  onSearchAgain: () => void;
  testId?: string;
}) {
  if (!request || !request.subject.birthRecordId) return null;
  const s = request.subject;
  const maskedName = `${s.firstName?.charAt(0) || ""}${"*".repeat(Math.max((s.firstName?.length || 3) - 1, 2))} ${s.lastName?.charAt(0) || ""}${"*".repeat(
    Math.max((s.lastName?.length || 3) - 1, 2)
  )}`;

  return (
    <Modal show={show} handleClose={onClose} title="Record found" size="sm" testId={testId}>
      <div className="modal-body" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <dl className="review-readonly-fields">
          <div>
            <dt>Subject</dt>
            <dd>{maskedName}</dd>
          </div>
          <div>
            <dt>Date of birth</dt>
            <dd>{s.dateOfBirth}</dd>
          </div>
          <div>
            <dt>Birth-record status</dt>
            <dd>Registered</dd>
          </div>
          <div>
            <dt>Relationship check</dt>
            <dd>{request.requester.relationshipToSubject || "Confirmed by requester type"}</dd>
          </div>
        </dl>
      </div>
      <div className="modal-footer" style={{ display: "flex", gap: 8, justifyContent: "flex-end", padding: 16 }}>
        <Button text="Search again" appearance="ghost" onClick={onSearchAgain} testId={`${testId}-search-again`} />
        <Button text="This is the correct record" appearance="primary" onClick={onConfirm} testId={`${testId}-confirm`} />
      </div>
    </Modal>
  );
}
