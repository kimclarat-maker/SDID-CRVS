import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import Notice from "@/components/public/Notice";
import {
  demoGetMarriageApplicantResponseView,
  demoConfirmMarriagePartnerParticipation,
  demoUpdateMarriageApplicantOwnData,
  demoDeclineMarriagePartnerParticipation,
} from "@/demo/services/crvsMarriagePartnerResponse";
import { MarriageApplicantResponseView, MarriageApplicant, CivilStatusCategory } from "@/domain/crvs/types";
import { CIVIL_STATUS_LABELS, formatDate } from "@/screens/dashboard/crvs/marriageShared";
import toastMessage from "@/utils/common/toastMessage";

type ResponseOutcome = "PENDING" | "CONFIRMED" | "DECLINED";

/**
 * Token-gated applicant-response page (route
 * /civil-registration/marriage/respond/:token). Unlike death's equivalent
 * page (which scans crvsDeathRegistrations directly for a matching token),
 * this calls demoGetMarriageApplicantResponseView(token) directly — it
 * already handles the token lookup internally and returns only the scoped
 * MarriageApplicantResponseView projection: the responding applicant's own
 * full editable data, plus only a minimal MarriagePartner summary of the
 * other spouse (never their documents, contact details, or witnesses).
 */
export default function MarriagePartnerResponse() {
  const { token } = useParams<{ token: string }>();
  const [view, setView] = useState<MarriageApplicantResponseView | undefined>();
  const [loading, setLoading] = useState(true);
  const [outcome, setOutcome] = useState<ResponseOutcome>("PENDING");

  const [confirmingConfirm, setConfirmingConfirm] = useState(false);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [busy, setBusy] = useState(false);

  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editResidence, setEditResidence] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCivilStatus, setEditCivilStatus] = useState<CivilStatusCategory>("SINGLE");

  useEffect(() => {
    if (!token) return;
    demoGetMarriageApplicantResponseView(token)
      .then((found) => {
        setView(found);
        if (found) {
          setEditFirstName(found.ownData.firstName || "");
          setEditLastName(found.ownData.lastName || "");
          setEditResidence(found.ownData.residence || "");
          setEditPhone(found.ownData.phone || "");
          setEditEmail(found.ownData.email || "");
          setEditCivilStatus(found.ownData.civilStatus);
          if (found.ownData.partnerConfirmationStatus === "CONFIRMED") setOutcome("CONFIRMED");
          if (found.ownData.partnerConfirmationStatus === "DECLINED") setOutcome("DECLINED");
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const actorName = view ? [view.ownData.firstName, view.ownData.lastName].filter(Boolean).join(" ") || "Applicant 2" : "Applicant 2";

  const handleConfirm = async () => {
    if (!token) return;
    setBusy(true);
    try {
      demoConfirmMarriagePartnerParticipation(token, actorName);
      setOutcome("CONFIRMED");
      setConfirmingConfirm(false);
      toastMessage("success", "Participation confirmed.");
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveCorrection = async () => {
    if (!token) return;
    setBusy(true);
    try {
      const patch: Partial<MarriageApplicant> = {
        firstName: editFirstName || undefined,
        lastName: editLastName || undefined,
        residence: editResidence || undefined,
        phone: editPhone || undefined,
        email: editEmail || undefined,
        civilStatus: editCivilStatus,
      };
      demoUpdateMarriageApplicantOwnData(token, patch, actorName);
      setView((prev) => (prev ? { ...prev, ownData: { ...prev.ownData, ...patch } } : prev));
      setShowCorrectionForm(false);
      toastMessage("success", "Your information has been updated.");
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setBusy(false);
    }
  };

  const handleDecline = async () => {
    if (!token) return;
    if (!declineReason.trim()) {
      toastMessage("error", "Enter a reason for declining.");
      return;
    }
    setBusy(true);
    try {
      demoDeclineMarriagePartnerParticipation(token, declineReason.trim(), actorName);
      setOutcome("DECLINED");
      setShowDeclineForm(false);
      toastMessage("success", "Your response has been recorded.");
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <PageHeader title="Loading…" eyebrow="Civil registration" />;
  }

  if (!view) {
    return (
      <>
        <PageHeader title="Link not found" eyebrow="Civil registration" />
        <Section>
          <Notice type="warning" title="This link is no longer valid">
            The response link may be incorrect, or the application may no longer be awaiting your response. Contact a
            service centre for help.
          </Notice>
        </Section>
      </>
    );
  }

  const disabledByOutcome = outcome !== "PENDING";

  return (
    <>
      <PageHeader title="Respond to a marriage declaration" description={view.applicationReference} eyebrow="Civil registration" />
      <Section>
        {outcome === "CONFIRMED" && (
          <Notice type="success" title="You have confirmed participation">
            Thank you — your confirmation has been recorded. No further action is needed from you right now.
          </Notice>
        )}
        {outcome === "DECLINED" && (
          <Notice type="danger" title="You have declined participation">
            This declaration has been rejected as a result. No further action is needed or possible from this page.
          </Notice>
        )}

        <div className="public-grid public-grid-2" style={{ marginTop: "1rem" }}>
          <div className="public-card">
            <h3>Your details on file</h3>
            <dl className="public-fact-list">
              <div>
                <dt>Name</dt>
                <dd>{[view.ownData.firstName, view.ownData.middleName, view.ownData.lastName].filter(Boolean).join(" ") || "—"}</dd>
              </div>
              <div>
                <dt>Civil status</dt>
                <dd>{CIVIL_STATUS_LABELS[view.ownData.civilStatus]}</dd>
              </div>
              <div>
                <dt>Residence</dt>
                <dd>{view.ownData.residence || "—"}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{view.ownData.phone || "—"}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{view.ownData.email || "—"}</dd>
              </div>
            </dl>
          </div>

          <div className="public-card">
            <h3>About this declaration</h3>
            <dl className="public-fact-list">
              <div>
                <dt>Other applicant</dt>
                <dd>{[view.partner.firstName, view.partner.lastName].filter(Boolean).join(" ") || "—"}</dd>
              </div>
              <div>
                <dt>Proposed marriage date</dt>
                <dd>{formatDate(view.proposedMarriageDate)}</dd>
              </div>
              <div>
                <dt>Office</dt>
                <dd>{view.officeName || "—"}</dd>
              </div>
            </dl>
          </div>
        </div>

        {view.correctionRequest && (
          <>
            <h3 style={{ marginTop: "1.5rem" }}>Correction requested</h3>
            <ul className="public-grid public-grid-2" style={{ listStyle: "none", padding: 0 }}>
              {view.correctionRequest.items.map((item) => (
                <li key={item.id} className="public-card">
                  <strong>{item.section.replace(/_/g, " ")}</strong>
                  <p>{item.reason}</p>
                  {item.note && <p className="public-form-hint">{item.note}</p>}
                  {item.fields.length > 0 && <p className="public-form-hint">Fields: {item.fields.join(", ")}</p>}
                </li>
              ))}
            </ul>
          </>
        )}

        {!disabledByOutcome && (
          <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              {!confirmingConfirm ? (
                <button type="button" className="public-btn public-btn-primary" onClick={() => setConfirmingConfirm(true)} data-testid="respond-confirm-start">
                  Confirm participation
                </button>
              ) : (
                <div className="public-card">
                  <p>Confirm that you agree to participate in this marriage declaration?</p>
                  <div className="public-hero-actions">
                    <button type="button" className="public-btn public-btn-primary" onClick={handleConfirm} disabled={busy} data-testid="respond-confirm-yes">
                      Yes, confirm
                    </button>
                    <button type="button" className="public-btn public-btn-outline" onClick={() => setConfirmingConfirm(false)} disabled={busy} data-testid="respond-confirm-cancel">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <button
                type="button"
                className="public-btn public-btn-secondary"
                onClick={() => setShowCorrectionForm((v) => !v)}
                data-testid="respond-correct-toggle"
              >
                Correct my information
              </button>
              {showCorrectionForm && (
                <div className="public-card" style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                  <label>
                    First name
                    <input value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} data-testid="respond-edit-first-name" />
                  </label>
                  <label>
                    Last name
                    <input value={editLastName} onChange={(e) => setEditLastName(e.target.value)} data-testid="respond-edit-last-name" />
                  </label>
                  <label>
                    Residence
                    <input value={editResidence} onChange={(e) => setEditResidence(e.target.value)} data-testid="respond-edit-residence" />
                  </label>
                  <label>
                    Phone
                    <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} data-testid="respond-edit-phone" />
                  </label>
                  <label>
                    Email
                    <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} data-testid="respond-edit-email" />
                  </label>
                  <label>
                    Civil status
                    <select value={editCivilStatus} onChange={(e) => setEditCivilStatus(e.target.value as CivilStatusCategory)} data-testid="respond-edit-civil-status">
                      {(Object.keys(CIVIL_STATUS_LABELS) as CivilStatusCategory[]).map((status) => (
                        <option key={status} value={status}>
                          {CIVIL_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="public-hero-actions">
                    <button type="button" className="public-btn public-btn-primary" onClick={handleSaveCorrection} disabled={busy} data-testid="respond-save-correction">
                      Save changes
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <button
                type="button"
                className="public-btn public-btn-outline"
                onClick={() => setShowDeclineForm((v) => !v)}
                data-testid="respond-decline-toggle"
              >
                Decline participation
              </button>
              {showDeclineForm && (
                <div className="public-card" style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                  <Notice type="warning" title="Declining will reject this declaration">
                    This cannot be undone from this page. A new declaration would be needed to try again.
                  </Notice>
                  <label>
                    Reason for declining
                    <textarea
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      rows={3}
                      data-testid="respond-decline-reason"
                    />
                  </label>
                  <div className="public-hero-actions">
                    <button type="button" className="public-btn public-btn-primary" onClick={handleDecline} disabled={busy} data-testid="respond-decline-confirm">
                      Confirm decline
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Section>
    </>
  );
}
