import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import Icon from "@/components/icon";
import StatusBadge from "../../components/StatusBadge";
import RestrictedCauseOfDeathNotice from "../../components/RestrictedCauseOfDeathNotice";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import { demoGetDeathNotification, canConvertDeathNotification } from "@/demo/services/crvsDeathNotifications";
import { DEATH_NOTIFICATION_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { DeathNotification } from "@/domain/crvs/types";
import { deceasedDisplayName, PATHWAY_LABELS, PLACE_CATEGORY_LABELS, DOCUMENT_TYPE_LABELS, maskDocumentNumber, formatDateTime } from "../../deathShared";
import SubmitDeathNotificationModal from "../components/modals/SubmitDeathNotificationModal";
import CancelDeathNotificationModal from "../components/modals/CancelDeathNotificationModal";
import AcceptDeathNotificationModal from "../components/modals/AcceptDeathNotificationModal";
import ReturnDeathNotificationModal from "../components/modals/ReturnDeathNotificationModal";
import ConvertToDeathRegistrationModal from "../components/modals/ConvertToDeathRegistrationModal";
import "../../shared.css";

type ModalKey = "submit" | "cancel" | "accept" | "return" | "convert" | undefined;

export default function DeathNotificationDetails() {
  const navigate = useNavigate();
  const { notificationId } = useParams<{ notificationId: string }>();

  const [notification, setNotification] = useState<DeathNotification | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [openModal, setOpenModal] = useState<ModalKey>(undefined);

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_NOTIFICATION_VIEW);
  const canEdit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_NOTIFICATION_EDIT);
  const canSubmit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_NOTIFICATION_SUBMIT);
  const canCancel = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_NOTIFICATION_CANCEL);
  const canAccept = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_NOTIFICATION_ACCEPT);
  const canReturn = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_NOTIFICATION_RETURN);
  const canConvert = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_REGISTRATION_CONVERT);

  const load = () => {
    if (!notificationId || !canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    demoGetDeathNotification(notificationId)
      .then((result) => setNotification(result))
      .catch((err) => setError(err?.message || "Couldn't load this notification."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [notificationId, canView]);

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty icon="lock" title="You don't have access to this notification" description="Viewing death notifications requires a CRVS role with notification-view access." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="crvs-page">
        <p className="crvs-form-hint">Loading notification…</p>
      </div>
    );
  }

  if (error || !notification) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Notification not found"
          description={error || "This death notification doesn't exist or has been removed."}
          button={<Button text="Back to death notifications" appearance="ghost" onClick={() => navigate("/dashboard/crvs/death-notifications")} testId="dn-details-not-found-back" />}
        />
      </div>
    );
  }

  const eligibleForConvert = canConvertDeathNotification(notification);

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 className="crvs-page-title">{notification.reference}</h1>
            <p className="crvs-page-subtitle">{deceasedDisplayName(notification.deceased)}</p>
          </div>
          <StatusBadge kind="deathNotification" status={notification.status} />
        </div>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      {notification.status === "RETURNED" && notification.returnReason && (
        <div className="crvs-banner crvs-banner-warning">
          <Icon name="undo" />
          <div>
            <strong>Outstanding correction:</strong> {notification.returnReason.reason}
            {notification.returnReason.note ? ` — ${notification.returnReason.note}` : ""}
            {notification.returnReason.fields.length > 0 && (
              <div className="crvs-form-hint">Fields to review: {notification.returnReason.fields.join(", ")}</div>
            )}
          </div>
        </div>
      )}

      {notification.status === "CANCELLED" && notification.cancellationReason && (
        <div className="crvs-banner crvs-banner-danger">
          <Icon name="block" />
          <div>
            <strong>Cancelled:</strong> {notification.cancellationReason}
          </div>
        </div>
      )}

      {notification.convertedToRegistrationId && (
        <div className="crvs-banner crvs-banner-info">
          <Icon name="link" />
          <div>
            Converted to death registration case.{" "}
            <Link to={`/dashboard/crvs/death-registrations/${notification.convertedToRegistrationId}`}>View registration</Link>
          </div>
        </div>
      )}

      <div className="crvs-section">
        <h2 className="crvs-section-title">Occurrence</h2>
        <dl className="crvs-form-grid" style={{ margin: 0 }}>
          <div>
            <dt className="crvs-form-hint">Pathway</dt>
            <dd style={{ margin: 0 }}>{PATHWAY_LABELS[notification.pathway]}</dd>
          </div>
          <div>
            <dt className="crvs-form-hint">Place category</dt>
            <dd style={{ margin: 0 }}>{PLACE_CATEGORY_LABELS[notification.occurrence.placeCategory]}</dd>
          </div>
          <div>
            <dt className="crvs-form-hint">Date of death</dt>
            <dd style={{ margin: 0 }}>{notification.occurrence.dateOfDeath?.slice(0, 10) || "—"}</dd>
          </div>
          <div>
            <dt className="crvs-form-hint">Time of death</dt>
            <dd style={{ margin: 0 }}>{notification.occurrence.timeOfDeath || "—"}</dd>
          </div>
          <div>
            <dt className="crvs-form-hint">Location</dt>
            <dd style={{ margin: 0 }}>{notification.occurrence.location || "—"}</dd>
          </div>
          <div>
            <dt className="crvs-form-hint">Jurisdiction</dt>
            <dd style={{ margin: 0 }}>{notification.occurrence.jurisdiction || "—"}</dd>
          </div>
        </dl>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Deceased</h2>
        {notification.deceased.identityStatus === "IDENTITY_UNKNOWN" ? (
          <p className="crvs-form-hint">{notification.deceased.descriptivePhysicalSummary || "No description recorded."}</p>
        ) : (
          <dl className="crvs-form-grid" style={{ margin: 0 }}>
            <div>
              <dt className="crvs-form-hint">Name</dt>
              <dd style={{ margin: 0 }}>{deceasedDisplayName(notification.deceased)}</dd>
            </div>
            <div>
              <dt className="crvs-form-hint">Sex</dt>
              <dd style={{ margin: 0 }}>{notification.deceased.sex}</dd>
            </div>
            <div>
              <dt className="crvs-form-hint">Document</dt>
              <dd style={{ margin: 0 }}>
                {notification.deceased.documentType ? DOCUMENT_TYPE_LABELS[notification.deceased.documentType] : "—"}
                {notification.deceased.documentType && notification.deceased.documentType !== "NONE"
                  ? ` — ${maskDocumentNumber(notification.deceased.documentNumber)}`
                  : ""}
              </dd>
            </div>
          </dl>
        )}
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Medical certification</h2>
        <RestrictedCauseOfDeathNotice cause={notification.medicalCertification?.cause}>
          {notification.medicalCertification?.isCertified ? (
            <dl className="crvs-form-grid" style={{ margin: 0 }}>
              <div>
                <dt className="crvs-form-hint">Certifier</dt>
                <dd style={{ margin: 0 }}>{notification.medicalCertification.certifierName || "—"}</dd>
              </div>
              <div>
                <dt className="crvs-form-hint">Certificate reference</dt>
                <dd style={{ margin: 0 }}>{notification.medicalCertification.certificateReferenceNumber || "—"}</dd>
              </div>
              <div>
                <dt className="crvs-form-hint">Immediate cause</dt>
                <dd style={{ margin: 0 }}>{notification.medicalCertification.cause.immediateCause || "—"}</dd>
              </div>
            </dl>
          ) : (
            <p className="crvs-form-hint">No medical certification has been attached to this notification.</p>
          )}
        </RestrictedCauseOfDeathNotice>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Facility &amp; notifier</h2>
        <dl className="crvs-form-grid" style={{ margin: 0 }}>
          <div>
            <dt className="crvs-form-hint">Facility</dt>
            <dd style={{ margin: 0 }}>{notification.facilityName || "—"}</dd>
          </div>
          <div>
            <dt className="crvs-form-hint">Notified by</dt>
            <dd style={{ margin: 0 }}>{notification.notifierName}</dd>
          </div>
        </dl>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Timeline</h2>
        <div className="crvs-timeline">
          {notification.statusHistory.map((entry, i) => (
            <span key={`${entry.status}-${i}`} className="crvs-timeline-item is-reached">
              <span className="crvs-timeline-dot" />
              {DEATH_NOTIFICATION_STATUS_LABELS[entry.status]} · {formatDateTime(entry.at)} · {entry.by}
              {entry.note ? ` — ${entry.note}` : ""}
            </span>
          ))}
        </div>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Actions</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(notification.status === "DRAFT" || notification.status === "RETURNED") && canEdit && (
            <Button
              text={notification.status === "RETURNED" ? "Respond to correction" : "Continue editing"}
              appearance="primary"
              type="button"
              onClick={() => navigate(`/dashboard/crvs/death-notifications/${notification.id}/edit`)}
              testId="dn-details-edit"
            />
          )}
          {notification.status === "DRAFT" && canSubmit && (
            <Button text="Submit notification" appearance="primary" type="button" onClick={() => setOpenModal("submit")} testId="dn-details-submit" />
          )}
          {notification.status === "DRAFT" && canCancel && (
            <Button text="Cancel notification" appearance="ghost" color="red" type="button" onClick={() => setOpenModal("cancel")} testId="dn-details-cancel" />
          )}
          {notification.status === "SUBMITTED" && canAccept && (
            <Button text="Accept notification" appearance="primary" type="button" onClick={() => setOpenModal("accept")} testId="dn-details-accept" />
          )}
          {notification.status === "SUBMITTED" && canReturn && (
            <Button text="Return for correction" appearance="ghost" color="red" type="button" onClick={() => setOpenModal("return")} testId="dn-details-return" />
          )}
          {notification.status === "ACCEPTED" && canConvert && (
            <div>
              <Button
                text="Convert to registration"
                appearance="primary"
                type="button"
                disabled={!eligibleForConvert}
                onClick={() => setOpenModal("convert")}
                testId="dn-details-convert"
              />
              {!eligibleForConvert && (
                <p className="crvs-form-hint" style={{ marginTop: 6 }}>
                  {notification.convertedToRegistrationId
                    ? "This notification has already been converted to a registration case."
                    : "This notification is not eligible for conversion."}
                </p>
              )}
            </div>
          )}
          {!(
            (notification.status === "DRAFT" && (canEdit || canSubmit || canCancel)) ||
            (notification.status === "RETURNED" && canEdit) ||
            (notification.status === "SUBMITTED" && (canAccept || canReturn)) ||
            (notification.status === "ACCEPTED" && canConvert)
          ) && <p className="crvs-form-hint">No actions available for your role at this status.</p>}
        </div>
      </div>

      <SubmitDeathNotificationModal
        show={openModal === "submit"}
        onClose={() => setOpenModal(undefined)}
        notification={notification}
        onSubmitted={(updated) => {
          setOpenModal(undefined);
          setNotification(updated);
        }}
      />
      <CancelDeathNotificationModal
        show={openModal === "cancel"}
        onClose={() => setOpenModal(undefined)}
        notification={notification}
        onCancelled={(updated) => {
          setOpenModal(undefined);
          setNotification(updated);
        }}
      />
      <AcceptDeathNotificationModal
        show={openModal === "accept"}
        onClose={() => setOpenModal(undefined)}
        notification={notification}
        onAccepted={(updated) => {
          setOpenModal(undefined);
          setNotification(updated);
        }}
      />
      <ReturnDeathNotificationModal
        show={openModal === "return"}
        onClose={() => setOpenModal(undefined)}
        notification={notification}
        onReturned={(updated) => {
          setOpenModal(undefined);
          setNotification(updated);
        }}
      />
      <ConvertToDeathRegistrationModal show={openModal === "convert"} onClose={() => setOpenModal(undefined)} notification={notification} />
    </div>
  );
}
