import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import Notice from "@/components/public/Notice";
import Button from "@/components/button";
import Icon from "@/components/icon";
import ConfirmActionModal from "@/components/crvs/modals/ConfirmActionModal";
import DocumentPreviewModal from "@/components/crvs/modals/DocumentPreviewModal";
import AnnulmentEvidenceUploadModal from "../declaration/components/modals/AnnulmentEvidenceUploadModal";
import {
  demoGetAnnulmentApplicantResponseView,
  demoUpdateAnnulmentApplicantOwnData,
  demoAcknowledgeAnnulmentCorrectionItem,
  demoResubmitAnnulmentViaToken,
} from "@/demo/services/crvsAnnulmentCorrectionResponse";
import { demoGetAnnulmentRegistration } from "@/demo/services/crvsAnnulmentRegistrations";
import { demoAttachAnnulmentEvidence, demoReplaceAnnulmentEvidence } from "@/demo/services/crvsAnnulmentEvidence";
import { AttachEvidenceInput } from "@/demo/services/crvsEvidence";
import { annulmentPolicyConfig } from "@/domain/crvs/annulmentPolicyConfig";
import { AnnulmentApplicant, AnnulmentApplicantResponseView, AnnulmentEvidence, AnnulmentReviewSectionKey } from "@/domain/crvs/types";
import { annulmentDocumentLabel, formatDate, formatDateTime, isRestrictedAnnulmentDocument } from "../marriageAnnulmentShared";
import toastMessage from "@/utils/common/toastMessage";
import "@/screens/dashboard/crvs/shared.css";
import "../marriageAnnulmentPublic.css";

const SECTION_LABELS: Record<AnnulmentReviewSectionKey, string> = {
  APPLICANT: "Your own details",
  EXISTING_MARRIAGE: "The marriage this decision annuls",
  AFFECTED_PARTY_1: "First affected person",
  AFFECTED_PARTY_2: "Second affected person",
  DECISION: "The annulment decision",
  EVIDENCE: "Supporting evidence",
  IDENTITY_CHECKS: "Identity checks",
  LEGAL_EFFECT: "Legal-effect classification",
  PROCESSING_OFFICE: "Processing office",
  OFFICER_DECLARATION: "Declarations",
};

/** The applicant fields this page is able to correct. Anything else in the
 * case file belongs to a registrar, not to a token holder. */
type EditableApplicantField =
  | "firstName"
  | "middleName"
  | "lastName"
  | "dateOfBirth"
  | "nationality"
  | "residence"
  | "phone"
  | "email"
  | "documentNumber"
  | "authorizationBasis";

const APPLICANT_FIELDS: { key: EditableApplicantField; label: string; type: "text" | "date" | "email" | "textarea" }[] = [
  { key: "firstName", label: "First name", type: "text" },
  { key: "middleName", label: "Middle name", type: "text" },
  { key: "lastName", label: "Last name", type: "text" },
  { key: "dateOfBirth", label: "Date of birth", type: "date" },
  { key: "nationality", label: "Nationality", type: "text" },
  { key: "residence", label: "Place of residence", type: "text" },
  { key: "phone", label: "Phone number", type: "text" },
  { key: "email", label: "Email address", type: "email" },
  { key: "documentNumber", label: "Identity document number", type: "text" },
  { key: "authorizationBasis", label: "Authority under which you are submitting", type: "textarea" },
];

const normalizeFieldName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

type ApplicantDraft = Record<EditableApplicantField, string>;

const draftFromApplicant = (applicant: AnnulmentApplicant): ApplicantDraft => ({
  firstName: applicant.firstName || "",
  middleName: applicant.middleName || "",
  lastName: applicant.lastName || "",
  dateOfBirth: applicant.dateOfBirth ? applicant.dateOfBirth.slice(0, 10) : "",
  nationality: applicant.nationality || "",
  residence: applicant.residence || "",
  phone: applicant.phone || "",
  email: applicant.email || "",
  documentNumber: applicant.documentNumber || "",
  authorizationBasis: applicant.authorizationBasis || "",
});

/**
 * Token-gated correction-response page (route
 * /civil-registration/marriage-annulment/respond/:token). No staff sign-in is
 * involved: demoGetAnnulmentApplicantResponseView(token) resolves the case
 * from the correction request's own responseToken and returns only the
 * scoped AnnulmentApplicantResponseView — the requested corrections, the
 * applicant's own submitted details, and the evidence list. Never the full
 * case file. Mirrors the public divorce correction-response page.
 *
 * Two rules shape everything below:
 *
 * 1. Only the sections a registrar actually asked about are unlocked. A
 *    correction request about the decision does not become a licence to
 *    rewrite the whole submission.
 * 2. The original submission is preserved. Edits patch only the live
 *    applicant/evidence fields through the demo services; the status history
 *    and the correction requests themselves are never rewritten from here,
 *    and replaced documents are superseded rather than deleted.
 */
export default function AnnulmentCorrectionResponse() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [view, setView] = useState<AnnulmentApplicantResponseView | undefined>();
  const [loading, setLoading] = useState(true);
  const [resubmitted, setResubmitted] = useState(false);

  // Resolved once, purely so evidence uploads can address the record by its
  // internal id (the evidence services key on `id`, while the token view
  // exposes only the public reference). Nothing from the full record is read
  // or rendered — doing so would defeat the point of the scoped projection.
  const [registrationId, setRegistrationId] = useState<string | undefined>();

  const [applicantDraft, setApplicantDraft] = useState<ApplicantDraft | undefined>();
  const [savingApplicant, setSavingApplicant] = useState(false);
  const [itemResponses, setItemResponses] = useState<Record<string, string>>({});
  const [savingItemId, setSavingItemId] = useState<string | undefined>();

  const [uploadTarget, setUploadTarget] = useState<{ replacing?: AnnulmentEvidence } | undefined>();
  const [previewing, setPreviewing] = useState<AnnulmentEvidence | undefined>();

  const [showResubmit, setShowResubmit] = useState(false);
  const [resubmitConfirmed, setResubmitConfirmed] = useState(false);

  const loadView = async (activeToken: string) => {
    const found = await demoGetAnnulmentApplicantResponseView(activeToken);
    setView(found);
    if (found) {
      setApplicantDraft(draftFromApplicant(found.applicant));
      setItemResponses(Object.fromEntries((found.correctionRequest?.items || []).map((item) => [item.id, item.response || ""])));
      if (!registrationId) {
        try {
          const record = await demoGetAnnulmentRegistration(found.registrationReference);
          setRegistrationId(record?.id);
        } catch {
          setRegistrationId(undefined);
        }
      }
    }
    return found;
  };

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    demoGetAnnulmentApplicantResponseView(token)
      .then(async (found) => {
        if (cancelled) return;
        setView(found);
        if (found) {
          setApplicantDraft(draftFromApplicant(found.applicant));
          setItemResponses(Object.fromEntries((found.correctionRequest?.items || []).map((item) => [item.id, item.response || ""])));
          try {
            const record = await demoGetAnnulmentRegistration(found.registrationReference);
            if (!cancelled) setRegistrationId(record?.id);
          } catch {
            if (!cancelled) setRegistrationId(undefined);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setView(undefined);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // registrationId is intentionally not a dependency: it is resolved once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const correctionRequest = view?.correctionRequest;
  const openItems = correctionRequest?.items || [];

  const unlockedSections = useMemo(() => new Set(openItems.map((item) => item.section)), [openItems]);

  /** Which of your own fields a registrar asked about. An item that names no
   * specific fields unlocks the whole applicant section. */
  const unlockedApplicantFields = useMemo(() => {
    const applicantItems = openItems.filter((item) => item.section === "APPLICANT");
    if (applicantItems.length === 0) return new Set<EditableApplicantField>();
    const named = applicantItems.flatMap((item) => item.fields).map(normalizeFieldName);
    if (named.length === 0) return new Set<EditableApplicantField>(APPLICANT_FIELDS.map((field) => field.key));
    const matched = APPLICANT_FIELDS.filter(
      (field) => named.includes(normalizeFieldName(field.key)) || named.includes(normalizeFieldName(field.label))
    ).map((field) => field.key);
    return new Set<EditableApplicantField>(matched.length > 0 ? matched : APPLICANT_FIELDS.map((field) => field.key));
  }, [openItems]);

  const documentsRequested = openItems.some((item) => item.documentsRequired) || unlockedSections.has("EVIDENCE");

  const alreadyResolved = !!correctionRequest?.resolvedAt;

  const handleSaveApplicant = async () => {
    if (!token || !view || !applicantDraft) return;
    setSavingApplicant(true);
    try {
      // Only the unlocked fields are sent, and only where the value actually
      // changed — so nothing a registrar did not ask about is overwritten.
      const original = draftFromApplicant(view.applicant);
      const patch: Partial<AnnulmentApplicant> = {};
      unlockedApplicantFields.forEach((field) => {
        const next = applicantDraft[field].trim();
        if (next === original[field].trim()) return;
        patch[field] = next || undefined;
      });
      if (Object.keys(patch).length === 0) {
        toastMessage("info", "Nothing has changed yet.");
        return;
      }
      await demoUpdateAnnulmentApplicantOwnData(token, patch);
      await loadView(token);
      toastMessage("success", "Your details have been updated.");
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setSavingApplicant(false);
    }
  };

  const handleSaveItemResponse = async (itemId: string) => {
    if (!token) return;
    const response = (itemResponses[itemId] || "").trim();
    if (!response) {
      toastMessage("error", "Write a short response before saving.");
      return;
    }
    setSavingItemId(itemId);
    try {
      await demoAcknowledgeAnnulmentCorrectionItem(token, itemId, response);
      await loadView(token);
      toastMessage("success", "Your response has been recorded.");
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setSavingItemId(undefined);
    }
  };

  const handleUpload = async (input: AttachEvidenceInput) => {
    if (!token || !registrationId) {
      toastMessage("error", "This document could not be uploaded. Contact your processing office for help.");
      return;
    }
    const replacing = uploadTarget?.replacing;
    const actorName = [view?.applicant.firstName, view?.applicant.lastName].filter(Boolean).join(" ") || "Applicant";
    if (replacing) {
      await demoReplaceAnnulmentEvidence(registrationId, replacing.id, input, actorName);
    } else {
      await demoAttachAnnulmentEvidence(registrationId, input, actorName);
    }
    await loadView(token);
    toastMessage("success", replacing ? "Document replaced." : "Document uploaded.");
    setUploadTarget(undefined);
  };

  const handleResubmit = async () => {
    if (!token) return;
    await demoResubmitAnnulmentViaToken(token);
    setResubmitted(true);
    setShowResubmit(false);
    setResubmitConfirmed(false);
    toastMessage("success", "Your corrected request has been resubmitted for review.");
  };

  if (loading) {
    return <PageHeader title="Loading…" eyebrow="Civil registration" />;
  }

  if (!view) {
    return (
      <>
        <PageHeader title="This link is not valid" eyebrow="Civil registration" />
        <Section>
          <Notice type="warning" title="We couldn't open this response link">
            The link may have been typed incorrectly, may have expired, or the request may no longer be waiting for a
            response. Response links are valid for {annulmentPolicyConfig.sla.correctionResponseDays} days from the
            date a correction is requested.
          </Notice>
          <div className="public-hero-actions" style={{ marginTop: "1.5rem" }}>
            <button type="button" className="public-btn public-btn-primary" onClick={() => navigate("/civil-registration/marriage-annulment")} data-testid="annulment-respond-back">
              Back to marriage annulment registration
            </button>
            <button type="button" className="public-btn public-btn-outline" onClick={() => navigate("/help")} data-testid="annulment-respond-help-invalid">
              Get help
            </button>
          </div>
        </Section>
      </>
    );
  }

  const evidence = view.evidence.filter((item) => !item.removed);
  const locked = resubmitted || alreadyResolved;

  return (
    <>
      <PageHeader
        title="Respond to a correction request"
        description={`Registration ${view.registrationReference}`}
        eyebrow="Civil registration"
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Marriage annulment registration", href: "/civil-registration/marriage-annulment" },
          { label: "Respond" },
        ]}
      />

      <Section>
        {resubmitted && (
          <Notice type="success" title="Your corrected request has been resubmitted">
            A registration officer will review it again. You do not need to do anything else right now — track progress
            with your reference, {view.registrationReference}.
          </Notice>
        )}

        {!resubmitted && alreadyResolved && (
          <Notice type="info" title="This correction request has already been answered">
            The changes you made have been sent back for review, so this page is now read-only. If a further correction
            is needed you will receive a new link.
          </Notice>
        )}

        {!correctionRequest && !resubmitted && (
          <Notice type="info" title="There is nothing to correct right now">
            This link is valid, but no correction is currently outstanding on registration {view.registrationReference}.
            Track the request with your reference to see its status.
          </Notice>
        )}

        {correctionRequest && (
          <>
            <Notice type="warning" title="What a registration officer has asked for">
              Only the parts listed below can be changed. Everything else you originally submitted stays exactly as it
              is.
              {correctionRequest.responseDeadline
                ? ` Please respond by ${formatDate(correctionRequest.responseDeadline)}.`
                : ` You have ${annulmentPolicyConfig.sla.correctionResponseDays} days to respond.`}
            </Notice>

            <p className="public-form-hint">
              Requested {formatDateTime(correctionRequest.requestedAt)} by {correctionRequest.requestedBy}.
            </p>

            <ul className="annulment-option-list" style={{ marginTop: "1rem" }}>
              {openItems.map((item) => (
                <li key={item.id} className="crvs-case-card">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <strong>{SECTION_LABELS[item.section]}</strong>
                    <span className={`crvs-status-pill ${item.addressed || item.response ? "crvs-status-success" : "crvs-status-warning"}`}>
                      <Icon name={item.addressed || item.response ? "check_circle" : "pending"} />
                      {item.addressed ? "Addressed" : item.response ? "Response saved" : "Awaiting your response"}
                    </span>
                  </div>
                  <p style={{ margin: "8px 0 0" }}>{item.reason}</p>
                  {item.note && <p className="public-form-hint">{item.note}</p>}
                  {item.fields.length > 0 && <p className="public-form-hint">Fields concerned: {item.fields.join(", ")}</p>}
                  {item.documentsRequired && (
                    <p className="public-form-hint">
                      <Icon name="upload_file" /> A document needs to be provided or replaced for this item.
                    </p>
                  )}
                  {item.dueDate && <p className="public-form-hint">Due by {formatDate(item.dueDate)}.</p>}

                  <div className="crvs-form-group" style={{ marginTop: 12 }}>
                    <label htmlFor={`annulment-respond-item-${item.id}`}>Your response to this item</label>
                    <textarea
                      id={`annulment-respond-item-${item.id}`}
                      rows={3}
                      value={itemResponses[item.id] || ""}
                      disabled={locked}
                      onChange={(e) => setItemResponses((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      data-testid={`annulment-respond-item-${item.id}`}
                    />
                    <p className="public-form-hint">
                      Explain briefly what you have changed or attached. This is recorded against the item for the
                      registration officer.
                    </p>
                  </div>
                  {!locked && (
                    <Button
                      text="Save response"
                      appearance="ghost"
                      type="button"
                      loading={savingItemId === item.id}
                      disabled={!!savingItemId}
                      onClick={() => handleSaveItemResponse(item.id)}
                      testId={`annulment-respond-save-item-${item.id}`}
                    />
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        {unlockedSections.has("APPLICANT") && applicantDraft && (
          <div style={{ marginTop: "2rem" }}>
            <h2>Correct your own details</h2>
            <p className="public-form-hint">
              Only the fields a registration officer asked about can be edited. The others are shown so you can check
              them, but they stay as originally submitted.
            </p>
            <div className="crvs-form-grid" style={{ marginTop: 12 }}>
              {APPLICANT_FIELDS.map((field) => {
                const editable = unlockedApplicantFields.has(field.key) && !locked;
                const fieldId = `annulment-respond-applicant-${field.key}`;
                return (
                  <div className="crvs-form-group" key={field.key} style={field.type === "textarea" ? { gridColumn: "1 / -1" } : undefined}>
                    <label htmlFor={fieldId}>
                      {field.label}
                      {!editable && (
                        <span className="public-form-hint" style={{ marginInlineStart: 8 }}>
                          (not part of this correction)
                        </span>
                      )}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        id={fieldId}
                        rows={3}
                        value={applicantDraft[field.key]}
                        disabled={!editable}
                        onChange={(e) => setApplicantDraft((prev) => (prev ? { ...prev, [field.key]: e.target.value } : prev))}
                        data-testid={fieldId}
                      />
                    ) : (
                      <input
                        id={fieldId}
                        type={field.type}
                        value={applicantDraft[field.key]}
                        disabled={!editable}
                        onChange={(e) => setApplicantDraft((prev) => (prev ? { ...prev, [field.key]: e.target.value } : prev))}
                        data-testid={fieldId}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            {!locked && (
              <Button
                text="Save my details"
                appearance="primary"
                type="button"
                loading={savingApplicant}
                onClick={handleSaveApplicant}
                testId="annulment-respond-save-applicant"
                styles={{ marginTop: 12 }}
              />
            )}
          </div>
        )}

        {documentsRequested && (
          <div style={{ marginTop: "2rem" }}>
            <h2>Documents</h2>
            <p className="public-form-hint">
              Replace a document that was queried, or add one that was missing. Replacing a document never deletes the
              original — it is kept on the case record, marked as replaced, so the history stays intact.
            </p>

            {evidence.length === 0 ? (
              <p className="public-form-hint">No documents are currently attached to this request.</p>
            ) : (
              <ul className="annulment-option-list">
                {evidence.map((item) => (
                  <li
                    key={item.id}
                    className="crvs-case-card"
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}
                  >
                    <div style={{ minWidth: 0, flex: "1 1 240px" }}>
                      <strong>{annulmentDocumentLabel(item.documentType)}</strong>
                      {isRestrictedAnnulmentDocument(item.documentType) && (
                        <span className="annulment-restricted-badge" style={{ marginInlineStart: 8 }}>
                          <Icon name="lock" /> Restricted
                        </span>
                      )}
                      <span className="public-form-hint" style={{ display: "block", marginTop: 4 }}>
                        {item.fileName} · {item.fileSizeKb} KB · uploaded {formatDateTime(item.uploadedAt)}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <Button text="Preview" size="sm" appearance="ghost" type="button" onClick={() => setPreviewing(item)} testId={`annulment-respond-preview-${item.id}`} />
                      {!locked && (
                        <Button
                          text="Replace"
                          size="sm"
                          appearance="ghost"
                          type="button"
                          onClick={() => setUploadTarget({ replacing: item })}
                          testId={`annulment-respond-replace-${item.id}`}
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {!locked && (
              <Button
                text="Upload another document"
                appearance="ghost"
                startIcon="upload_file"
                type="button"
                onClick={() => setUploadTarget({})}
                testId="annulment-respond-upload"
                styles={{ marginTop: 12 }}
              />
            )}
          </div>
        )}

        {correctionRequest && !locked && (
          <div style={{ marginTop: "2rem" }}>
            <h2>Send your corrections back</h2>
            <Notice type="info" title="Nothing is sent until you confirm">
              Saving a change above updates your request but leaves it with you. Resubmitting is a separate, deliberate
              step: it returns the request to a registration officer and closes this response link.
            </Notice>
            <div className="public-hero-actions" style={{ marginTop: "1rem" }}>
              <button type="button" className="public-btn public-btn-primary" onClick={() => setShowResubmit(true)} data-testid="annulment-respond-resubmit">
                Resubmit my corrected request
              </button>
              <button
                type="button"
                className="public-btn public-btn-outline"
                onClick={() => navigate(`/civil-registration/marriage-annulment/case/${view.registrationReference}`)}
                data-testid="annulment-respond-track"
              >
                Track this registration
              </button>
            </div>
          </div>
        )}

        {locked && (
          <div className="public-hero-actions" style={{ marginTop: "2rem" }}>
            <button
              type="button"
              className="public-btn public-btn-primary"
              onClick={() => navigate(`/civil-registration/marriage-annulment/case/${view.registrationReference}`)}
              data-testid="annulment-respond-track-after"
            >
              Track this registration
            </button>
            <button type="button" className="public-btn public-btn-outline" onClick={() => navigate("/civil-registration/marriage-annulment")} data-testid="annulment-respond-service">
              Back to marriage annulment registration
            </button>
          </div>
        )}

        <p className="public-form-hint" style={{ marginTop: "1.5rem" }}>
          This page shows only what you need in order to respond: the corrections that were requested, your own
          submitted details, and the documents attached to the request. It never shows the other affected person's
          personal details, internal notes, or the rest of the case file.
        </p>
      </Section>

      <AnnulmentEvidenceUploadModal
        show={!!uploadTarget}
        onClose={() => setUploadTarget(undefined)}
        documentTypes={Array.from(new Set(evidence.map((item) => item.documentType)))}
        initialDocumentType={uploadTarget?.replacing?.documentType}
        replacingFileName={uploadTarget?.replacing?.fileName}
        onUpload={handleUpload}
      />

      <DocumentPreviewModal show={!!previewing} onClose={() => setPreviewing(undefined)} evidence={previewing} />

      <ConfirmActionModal
        show={showResubmit}
        onClose={() => {
          setShowResubmit(false);
          setResubmitConfirmed(false);
        }}
        onConfirm={handleResubmit}
        title="Resubmit your corrected request"
        description={view.registrationReference}
        confirmLabel="Resubmit for review"
        cancelLabel="Not yet"
        disabled={!resubmitConfirmed}
        testId="annulment-respond-resubmit-modal"
      >
        <p style={{ margin: 0 }}>
          Your request returns to a registration officer for review. This response link stops working once you
          resubmit, so make sure you have saved every change and uploaded every document that was asked for. If
          something else needs correcting later, you will be sent a new link.
        </p>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 12, fontWeight: 400 }}>
          <input
            type="checkbox"
            checked={resubmitConfirmed}
            onChange={(e) => setResubmitConfirmed(e.target.checked)}
            data-testid="annulment-respond-resubmit-confirm"
          />
          I confirm that I have made every correction that was requested, and that the information and documents I am
          resubmitting are true and accurate.
        </label>
      </ConfirmActionModal>
    </>
  );
}
