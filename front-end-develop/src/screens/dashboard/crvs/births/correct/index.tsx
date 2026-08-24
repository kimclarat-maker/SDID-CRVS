import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "@/components/icon";
import Button from "@/components/button";
import Empty from "@/components/empty";
import toastMessage from "@/utils/common/toastMessage";
import { demoGetRegistration, demoUpdateRegistrationDraft, demoResubmitCorrections } from "@/demo/services/crvsRegistrations";
import { demoReplaceEvidence, AttachEvidenceInput } from "@/demo/services/crvsEvidence";
import {
  BirthRegistrationCase,
  ChildDetails,
  Declarant,
  FatherDetails,
  IdentityDocumentType,
  MotherDetails,
  ReviewSectionKey,
  Sex,
  Witness,
} from "@/domain/crvs/types";
import { hasWorkspacePermission } from "@/utils/workspace";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { getActorName, formatDate, formatDateTime, maskDocumentNumber, DOCUMENT_TYPE_LABELS } from "../shared";
import AddWitnessModal from "../components/modals/AddWitnessModal";
import ReplaceEvidenceModal from "../components/modals/ReplaceEvidenceModal";
import ResubmitCorrectionsModal from "../components/modals/ResubmitCorrectionsModal";
import "../../shared.css";

const SECTION_LABELS: Record<ReviewSectionKey, string> = {
  CHILD: "Child",
  PARENTS: "Parents",
  DECLARANT: "Declarant",
  WITNESSES: "Witnesses",
  EVIDENCE: "Evidence",
  DUPLICATE_CHECK: "Duplicate check",
  LATE_OR_EXCEPTION: "Late registration / exception",
  OFFICER_DECLARATION: "Officer declaration",
};

const DOC_TYPES: IdentityDocumentType[] = ["NATIONAL_ID", "PASSPORT", "REFUGEE_ID", "DRIVER_LICENSE", "OTHER", "NONE"];

/** Correction workflow (spec §12): shows the registrar's correction
 * request, opens only the sections it references for editing (everything
 * else stays read-only), and requires the declaration to be reconfirmed
 * before resubmitting through demoResubmitCorrections. */
export default function CorrectBirthRegistration() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const actorName = getActorName();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [registrationCase, setRegistrationCase] = useState<BirthRegistrationCase | undefined>();
  const [saveError, setSaveError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const [child, setChild] = useState<ChildDetails | undefined>();
  const [mother, setMother] = useState<MotherDetails | undefined>();
  const [father, setFather] = useState<FatherDetails | undefined>();
  const [declarant, setDeclarant] = useState<Declarant | undefined>();
  const [dateReported, setDateReported] = useState("");
  const [delayReason, setDelayReason] = useState("");

  const [accuracyChecked, setAccuracyChecked] = useState(false);
  const [officerChecked, setOfficerChecked] = useState(false);
  const [declarantChecked, setDeclarantChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  const [showAddWitness, setShowAddWitness] = useState(false);
  const [evidenceToReplace, setEvidenceToReplace] = useState<string | undefined>();
  const [showResubmit, setShowResubmit] = useState(false);

  const canRespond = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CORRECTION_RESPOND);

  useEffect(() => {
    if (!caseId) return;
    let cancelled = false;
    demoGetRegistration(caseId)
      .then((c) => {
        if (cancelled) return;
        if (!c) {
          setLoadError("This registration case could not be found.");
          return;
        }
        if (c.status !== "CORRECTION_REQUIRED") {
          setLoadError("This case doesn't currently have an open correction request.");
        }
        setRegistrationCase(c);
        setChild(c.child);
        setMother(c.mother);
        setFather(c.father);
        setDeclarant(c.declarant);
        setDateReported(c.dateReported);
        setDelayReason(c.delayReason || "");
      })
      .catch((err) => setLoadError(err?.message || "Couldn't load this case."))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  const openRequest = useMemo(
    () => registrationCase?.correctionRequests.find((r) => !r.resolvedAt) || registrationCase?.correctionRequests[registrationCase.correctionRequests.length - 1],
    [registrationCase]
  );

  const affectedSections = useMemo(() => new Set((openRequest?.items || []).map((i) => i.section)), [openRequest]);

  if (loading) {
    return (
      <div className="crvs-page">
        <p className="crvs-form-hint">Loading correction request…</p>
      </div>
    );
  }

  if (!registrationCase || (loadError && registrationCase.status !== "CORRECTION_REQUIRED")) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Can't respond to a correction here"
          description={loadError}
          button={<Button type="button" text="Back" appearance="ghost" onClick={() => navigate(-1)} testId="correct-back" />}
        />
      </div>
    );
  }

  const c = registrationCase;
  const editable = (section: ReviewSectionKey) => canRespond && affectedSections.has(section);

  const handleSaveChanges = async () => {
    setSaveError(undefined);
    setSaving(true);
    try {
      const patch: Partial<BirthRegistrationCase> = {};
      if (editable("CHILD") && child) patch.child = child;
      if (editable("PARENTS") && mother) patch.mother = mother;
      if (editable("PARENTS") && father) patch.father = father;
      if (editable("DECLARANT") && declarant) patch.declarant = declarant;
      if (editable("LATE_OR_EXCEPTION")) {
        patch.dateReported = dateReported;
        patch.delayReason = delayReason;
      }
      const updated = demoUpdateRegistrationDraft(c.id, patch, actorName, c.version);
      setRegistrationCase(updated);
      toastMessage("success", "Changes saved.");
    } catch (err: any) {
      setSaveError(err?.message || "Couldn't save these changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddWitness = async (witness: Omit<Witness, "id">) => {
    const withId: Witness = { ...witness, id: `WT-${Date.now()}-${Math.round(Math.random() * 1000)}` };
    try {
      const updated = demoUpdateRegistrationDraft(c.id, { witnesses: [...c.witnesses, withId] }, actorName, c.version);
      setRegistrationCase(updated);
      setShowAddWitness(false);
    } catch (err) {
      toastMessage("error", err);
    }
  };

  const handleReplaceEvidence = async (input: AttachEvidenceInput) => {
    if (!evidenceToReplace) return;
    const item = demoReplaceEvidence(c.id, evidenceToReplace, input, actorName);
    setRegistrationCase((prev) =>
      prev
        ? { ...prev, evidence: [...prev.evidence.map((e) => (e.id === evidenceToReplace ? { ...e, removed: true } : e)), item], version: prev.version + 1 }
        : prev
    );
    setEvidenceToReplace(undefined);
  };

  const declarationReady = accuracyChecked && officerChecked && declarantChecked && privacyChecked;

  const handleResubmit = async () => {
    if (!declarationReady) {
      throw new Error("All four declaration confirmations are required before resubmitting.");
    }
    await demoUpdateRegistrationDraft(
      c.id,
      { declarationConfirmed: accuracyChecked && officerChecked, declarantConfirmed: declarantChecked, privacyAcknowledged: privacyChecked },
      actorName,
      c.version
    );
    const updated = demoResubmitCorrections(c.id, actorName);
    setRegistrationCase(updated);
    setShowResubmit(false);
    navigate(`/dashboard/crvs/births/${c.id}`);
  };

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Respond to correction — {c.reference}</h1>
        <p className="crvs-page-subtitle">Only the sections the registrar flagged are editable below; everything else stays read-only.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      {openRequest && (
        <section className="crvs-section">
          <h3 className="crvs-section-title">Correction summary</h3>
          <p className="crvs-form-hint">Requested by {openRequest.requestedBy} on {formatDateTime(openRequest.requestedAt)}</p>
          <div className="crvs-table-scroll">
            <table className="crvs-table">
              <thead>
                <tr><th>Section</th><th>Fields</th><th>Reason</th><th>Due date</th><th>Evidence replacement</th></tr>
              </thead>
              <tbody>
                {openRequest.items.map((item) => (
                  <tr key={item.id}>
                    <td>{SECTION_LABELS[item.section]}</td>
                    <td>{item.fields.join(", ") || "—"}</td>
                    <td>{item.reason}{item.note ? ` — ${item.note}` : ""}</td>
                    <td>{item.dueDate ? formatDate(item.dueDate) : "—"}</td>
                    <td>{item.requiredEvidenceReplacement ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {saveError && <p className="crvs-form-error">{saveError}</p>}

      {/* Child */}
      <section className="crvs-section">
        <h3 className="crvs-section-title">Child {editable("CHILD") ? "" : "(read-only)"}</h3>
        {editable("CHILD") && child ? (
          <div className="crvs-form-grid">
            <div className="crvs-form-group">
              <label htmlFor="c-first">First name</label>
              <input id="c-first" value={child.firstName || ""} onChange={(e) => setChild({ ...child, firstName: e.target.value })} />
              {c.child.firstName !== child.firstName && <span className="crvs-form-hint">Was: {c.child.firstName || "—"}</span>}
            </div>
            <div className="crvs-form-group">
              <label htmlFor="c-last">Last name</label>
              <input id="c-last" value={child.lastName} onChange={(e) => setChild({ ...child, lastName: e.target.value })} />
              {c.child.lastName !== child.lastName && <span className="crvs-form-hint">Was: {c.child.lastName}</span>}
            </div>
            <div className="crvs-form-group">
              <label htmlFor="c-sex">Sex</label>
              <select id="c-sex" value={child.sex} onChange={(e) => setChild({ ...child, sex: e.target.value as Sex })}>
                <option value="UNKNOWN">Unknown</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
            <div className="crvs-form-group">
              <label htmlFor="c-dob">Date of birth</label>
              <input id="c-dob" type="date" value={child.dateOfBirth} onChange={(e) => setChild({ ...child, dateOfBirth: e.target.value })} />
              {c.child.dateOfBirth !== child.dateOfBirth && <span className="crvs-form-hint">Was: {formatDate(c.child.dateOfBirth)}</span>}
            </div>
          </div>
        ) : (
          <p className="crvs-form-hint">{[c.child.firstName, c.child.lastName].filter(Boolean).join(" ")} · {c.child.sex} · {formatDate(c.child.dateOfBirth)}</p>
        )}
      </section>

      {/* Parents */}
      <section className="crvs-section">
        <h3 className="crvs-section-title">Parents {editable("PARENTS") ? "" : "(read-only)"}</h3>
        {editable("PARENTS") && mother && father ? (
          <>
            <div className="crvs-form-grid">
              <div className="crvs-form-group">
                <label htmlFor="m-doc-type">Mother's document type</label>
                <select id="m-doc-type" value={mother.documentType} onChange={(e) => setMother({ ...mother, documentType: e.target.value as IdentityDocumentType })}>
                  {DOC_TYPES.map((t) => (<option key={t} value={t}>{DOCUMENT_TYPE_LABELS[t]}</option>))}
                </select>
              </div>
              <div className="crvs-form-group">
                <label htmlFor="m-doc-number">Mother's document number</label>
                <input id="m-doc-number" value={mother.documentNumber || ""} onChange={(e) => setMother({ ...mother, documentNumber: e.target.value })} />
                {c.mother.documentNumber !== mother.documentNumber && <span className="crvs-form-hint">Was: {maskDocumentNumber(c.mother.documentNumber)}</span>}
              </div>
              <div className="crvs-form-group">
                <label htmlFor="m-first">Mother's first name</label>
                <input id="m-first" value={mother.firstName} onChange={(e) => setMother({ ...mother, firstName: e.target.value })} />
              </div>
              <div className="crvs-form-group">
                <label htmlFor="m-last">Mother's last name</label>
                <input id="m-last" value={mother.lastName} onChange={(e) => setMother({ ...mother, lastName: e.target.value })} />
              </div>
            </div>
            <div className="crvs-form-grid" style={{ marginTop: 8 }}>
              <div className="crvs-form-group">
                <label htmlFor="f-first">Father's first name</label>
                <input id="f-first" value={father.firstName || ""} onChange={(e) => setFather({ ...father, firstName: e.target.value })} />
              </div>
              <div className="crvs-form-group">
                <label htmlFor="f-last">Father's last name</label>
                <input id="f-last" value={father.lastName || ""} onChange={(e) => setFather({ ...father, lastName: e.target.value })} />
              </div>
            </div>
          </>
        ) : (
          <p className="crvs-form-hint">
            Mother: {c.mother.firstName} {c.mother.lastName} ({maskDocumentNumber(c.mother.documentNumber)}) · Father: {c.father.firstName ? `${c.father.firstName} ${c.father.lastName}` : c.father.availability}
          </p>
        )}
      </section>

      {/* Declarant */}
      <section className="crvs-section">
        <h3 className="crvs-section-title">Declarant {editable("DECLARANT") ? "" : "(read-only)"}</h3>
        {editable("DECLARANT") && declarant ? (
          <div className="crvs-form-grid">
            <div className="crvs-form-group">
              <label htmlFor="d-first">First name</label>
              <input id="d-first" value={declarant.firstName} onChange={(e) => setDeclarant({ ...declarant, firstName: e.target.value })} />
            </div>
            <div className="crvs-form-group">
              <label htmlFor="d-last">Last name</label>
              <input id="d-last" value={declarant.lastName} onChange={(e) => setDeclarant({ ...declarant, lastName: e.target.value })} />
            </div>
            <div className="crvs-form-group">
              <label htmlFor="d-relationship">Relationship</label>
              <input id="d-relationship" value={declarant.relationship} onChange={(e) => setDeclarant({ ...declarant, relationship: e.target.value })} />
            </div>
          </div>
        ) : (
          <p className="crvs-form-hint">{c.declarant.firstName} {c.declarant.lastName} ({c.declarant.relationship})</p>
        )}
      </section>

      {/* Witnesses */}
      <section className="crvs-section">
        <div className="crvs-review-section-header">
          <h3 className="crvs-section-title" style={{ margin: 0 }}>Witnesses {editable("WITNESSES") ? "" : "(read-only)"}</h3>
          {editable("WITNESSES") && (
            <Button type="button" text="Add witness" size="sm" appearance="ghost" onClick={() => setShowAddWitness(true)} testId="correct-add-witness" />
          )}
        </div>
        {c.witnesses.length === 0 && <p className="crvs-form-hint">No witnesses recorded.</p>}
        {c.witnesses.map((w) => (
          <div key={w.id} className="crvs-form-hint">{w.firstName} {w.lastName} — {w.relationship}</div>
        ))}
      </section>

      {/* Evidence */}
      <section className="crvs-section">
        <h3 className="crvs-section-title">Evidence {editable("EVIDENCE") ? "" : "(read-only)"}</h3>
        <div className="crvs-card-grid">
          {c.evidence.filter((e) => !e.removed).map((e) => (
            <div key={e.id} className="crvs-case-card">
              <strong>{e.documentType}</strong>
              <span className="crvs-form-hint">{e.fileName}</span>
              {editable("EVIDENCE") && (
                <Button type="button" text="Replace" size="sm" appearance="ghost" onClick={() => setEvidenceToReplace(e.id)} testId={`correct-replace-${e.id}`} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Late / exception */}
      <section className="crvs-section">
        <h3 className="crvs-section-title">Late registration / exception {editable("LATE_OR_EXCEPTION") ? "" : "(read-only)"}</h3>
        {editable("LATE_OR_EXCEPTION") ? (
          <div className="crvs-form-grid">
            <div className="crvs-form-group">
              <label htmlFor="date-reported">Date reported</label>
              <input id="date-reported" type="date" value={dateReported} onChange={(e) => setDateReported(e.target.value)} />
            </div>
            <div className="crvs-form-group">
              <label htmlFor="delay-reason">Delay reason</label>
              <textarea id="delay-reason" rows={2} value={delayReason} onChange={(e) => setDelayReason(e.target.value)} />
            </div>
          </div>
        ) : (
          <p className="crvs-form-hint">{c.isLate ? `Late by ${c.daysAfterBirth} day(s). ${c.delayReason || ""}` : "Not a late registration."}</p>
        )}
      </section>

      {canRespond && (
        <div style={{ marginBottom: 16 }}>
          <Button type="button" text="Save changes" appearance="primary" loading={saving} onClick={handleSaveChanges} testId="correct-save-changes" />
        </div>
      )}

      {/* Officer declaration — always required to reconfirm */}
      <section className="crvs-section">
        <h3 className="crvs-section-title">Reconfirm declaration</h3>
        <label style={{ display: "block", marginBottom: 8 }}>
          <input type="checkbox" checked={accuracyChecked} onChange={(e) => setAccuracyChecked(e.target.checked)} style={{ marginRight: 8 }} />
          I confirm the corrected information is accurate to the best of my knowledge.
        </label>
        <label style={{ display: "block", marginBottom: 8 }}>
          <input type="checkbox" checked={officerChecked} onChange={(e) => setOfficerChecked(e.target.checked)} style={{ marginRight: 8 }} />
          As the processing officer, I have reviewed the corrections against the supporting evidence.
        </label>
        <label style={{ display: "block", marginBottom: 8 }}>
          <input type="checkbox" checked={declarantChecked} onChange={(e) => setDeclarantChecked(e.target.checked)} style={{ marginRight: 8 }} />
          The declarant has reviewed and confirmed the corrected details.
        </label>
        <label style={{ display: "block" }}>
          <input type="checkbox" checked={privacyChecked} onChange={(e) => setPrivacyChecked(e.target.checked)} style={{ marginRight: 8 }} />
          I acknowledge the privacy notice covering this application's identity data.
        </label>
      </section>

      {canRespond && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button type="button" text="Cancel" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/births/${c.id}`)} testId="correct-cancel" />
          <Button type="button" text="Resubmit" appearance="primary" disabled={!declarationReady} onClick={() => setShowResubmit(true)} testId="correct-resubmit-open" />
        </div>
      )}

      <AddWitnessModal
        show={showAddWitness}
        onClose={() => setShowAddWitness(false)}
        existingDocumentNumbers={c.witnesses.map((w) => w.documentNumber).filter(Boolean) as string[]}
        onAdd={handleAddWitness}
      />

      <ReplaceEvidenceModal
        show={!!evidenceToReplace}
        evidence={c.evidence.find((e) => e.id === evidenceToReplace)}
        onClose={() => setEvidenceToReplace(undefined)}
        onReplace={handleReplaceEvidence}
      />

      <ResubmitCorrectionsModal
        show={showResubmit}
        items={openRequest?.items || []}
        onClose={() => setShowResubmit(false)}
        onConfirm={handleResubmit}
      />
    </div>
  );
}
