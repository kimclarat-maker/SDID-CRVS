import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Empty from "@/components/empty";
import Button from "@/components/button";
import Icon from "@/components/icon";
import StatusBadge from "../../components/StatusBadge";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import { demoGetNotification, canConvertNotification } from "@/demo/services/crvsNotifications";
import { NOTIFICATION_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { BirthNotification } from "@/domain/crvs/types";
import {
  childFullName,
  maskDocumentNumber,
  DOCUMENT_TYPE_LABELS,
  FATHER_AVAILABILITY_LABELS,
  OCCURRENCE_TYPE_LABELS,
  SEX_LABELS,
} from "../components/NotificationWizard";
import SubmitNotificationModal from "../components/modals/SubmitNotificationModal";
import CancelNotificationModal from "../components/modals/CancelNotificationModal";
import AcceptNotificationModal from "../components/modals/AcceptNotificationModal";
import ReturnNotificationModal from "../components/modals/ReturnNotificationModal";
import ConvertToRegistrationModal from "../components/modals/ConvertToRegistrationModal";
import "../../shared.css";

type ModalKey = "submit" | "cancel" | "accept" | "return" | "convert" | undefined;

/** Full detail view for a single birth notification — status, facility,
 * event, child/parent info (document numbers masked), status timeline,
 * outstanding correction, linked registration, and every role-appropriate
 * action for its current status. */
export default function NotificationDetails() {
  const navigate = useNavigate();
  const { notificationId } = useParams<{ notificationId: string }>();

  const [notification, setNotification] = useState<BirthNotification | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [openModal, setOpenModal] = useState<ModalKey>(undefined);

  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.BIRTH_NOTIFICATION_VIEW);
  const canEdit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.BIRTH_NOTIFICATION_EDIT);
  const canSubmit = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.BIRTH_NOTIFICATION_SUBMIT);
  const canCancel = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.BIRTH_NOTIFICATION_CANCEL);
  const canAccept = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.BIRTH_NOTIFICATION_ACCEPT);
  const canReturn = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.BIRTH_NOTIFICATION_RETURN);
  const canConvert = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.REGISTRATION_CONVERT);

  const load = () => {
    if (!notificationId || !canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    demoGetNotification(notificationId)
      .then((result) => setNotification(result))
      .catch((err) => setError(err?.message || "Couldn't load this notification."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [notificationId, canView]);

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty
          icon="lock"
          title="You don't have access to this notification"
          description="Viewing birth notifications requires a CRVS role with notification-view access."
        />
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
          description={error || "This birth notification doesn't exist or has been removed."}
          button={<Button text="Back to notifications" appearance="ghost" onClick={() => navigate("/dashboard/crvs/notifications")} testId="details-not-found-back" />}
        />
      </div>
    );
  }

  const eligibleForConvert = canConvertNotification(notification);

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 className="crvs-page-title">{notification.reference}</h1>
            <p className="crvs-page-subtitle">{childFullName(notification.child)}</p>
          </div>
          <StatusBadge kind="notification" status={notification.status} />
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
            Converted to birth registration case.{" "}
            <Link to={`/dashboard/crvs/births/${notification.convertedToRegistrationId}`}>View registration</Link>
          </div>
        </div>
      )}

      <div className="crvs-section">
        <h2 className="crvs-section-title">Birth occurrence</h2>
        <dl className="crvs-form-grid" style={{ margin: 0 }}>
          <div>
            <dt className="crvs-form-hint">Occurrence type</dt>
            <dd style={{ margin: 0 }}>{OCCURRENCE_TYPE_LABELS[notification.occurrenceType]}</dd>
          </div>
          <div>
            <dt className="crvs-form-hint">Date of birth</dt>
            <dd style={{ margin: 0 }}>{notification.child.dateOfBirth || "—"}</dd>
          </div>
          <div>
            <dt className="crvs-form-hint">Time of birth</dt>
            <dd style={{ margin: 0 }}>{notification.child.timeOfBirth || "—"}</dd>
          </div>
          <div>
            <dt className="crvs-form-hint">Place of birth</dt>
            <dd style={{ margin: 0 }}>{notification.child.placeOfBirth || "—"}</dd>
          </div>
          <div>
            <dt className="crvs-form-hint">Source reference</dt>
            <dd style={{ margin: 0 }}>{notification.sourceReference || "—"}</dd>
          </div>
          <div>
            <dt className="crvs-form-hint">Multiple birth</dt>
            <dd style={{ margin: 0 }}>
              {notification.child.multipleBirth.isMultiple
                ? `Yes — order ${notification.child.multipleBirth.birthOrder ?? "?"} of ${notification.child.multipleBirth.totalBirths ?? "?"}`
                : "No"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Child</h2>
        <dl className="crvs-form-grid" style={{ margin: 0 }}>
          <div>
            <dt className="crvs-form-hint">Name</dt>
            <dd style={{ margin: 0 }}>{childFullName(notification.child)}</dd>
          </div>
          <div>
            <dt className="crvs-form-hint">Sex</dt>
            <dd style={{ margin: 0 }}>{SEX_LABELS[notification.child.sex]}</dd>
          </div>
        </dl>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Mother</h2>
        <dl className="crvs-form-grid" style={{ margin: 0 }}>
          <div>
            <dt className="crvs-form-hint">Name</dt>
            <dd style={{ margin: 0 }}>{[notification.mother.firstName, notification.mother.lastName].filter(Boolean).join(" ") || "—"}</dd>
          </div>
          <div>
            <dt className="crvs-form-hint">Document</dt>
            <dd style={{ margin: 0 }}>
              {DOCUMENT_TYPE_LABELS[notification.mother.documentType]}
              {notification.mother.documentType !== "NONE" ? ` — ${maskDocumentNumber(notification.mother.documentNumber)}` : ""}
            </dd>
          </div>
          <div>
            <dt className="crvs-form-hint">Nationality</dt>
            <dd style={{ margin: 0 }}>{notification.mother.nationality || "—"}</dd>
          </div>
          <div>
            <dt className="crvs-form-hint">Contact</dt>
            <dd style={{ margin: 0 }}>{notification.mother.phone || notification.mother.email || "—"}</dd>
          </div>
          <div>
            <dt className="crvs-form-hint">Residence</dt>
            <dd style={{ margin: 0 }}>{notification.mother.residence || "—"}</dd>
          </div>
        </dl>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Father</h2>
        <dl className="crvs-form-grid" style={{ margin: 0 }}>
          <div>
            <dt className="crvs-form-hint">Availability</dt>
            <dd style={{ margin: 0 }}>{FATHER_AVAILABILITY_LABELS[notification.father.availability]}</dd>
          </div>
          {(notification.father.availability === "PROVIDED_VERIFIED" || notification.father.availability === "PROVIDED_UNVERIFIED") && (
            <>
              <div>
                <dt className="crvs-form-hint">Name</dt>
                <dd style={{ margin: 0 }}>{[notification.father.firstName, notification.father.lastName].filter(Boolean).join(" ") || "—"}</dd>
              </div>
              <div>
                <dt className="crvs-form-hint">Document</dt>
                <dd style={{ margin: 0 }}>
                  {notification.father.documentType ? DOCUMENT_TYPE_LABELS[notification.father.documentType] : "—"}
                  {notification.father.documentType && notification.father.documentType !== "NONE"
                    ? ` — ${maskDocumentNumber(notification.father.documentNumber)}`
                    : ""}
                </dd>
              </div>
            </>
          )}
        </dl>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Facility &amp; notifier</h2>
        <dl className="crvs-form-grid" style={{ margin: 0 }}>
          <div>
            <dt className="crvs-form-hint">Facility</dt>
            <dd style={{ margin: 0 }}>{notification.facilityName}</dd>
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
              {NOTIFICATION_STATUS_LABELS[entry.status]} · {new Date(entry.at).toLocaleString()} · {entry.by}
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
              onClick={() => navigate(`/dashboard/crvs/notifications/${notification.id}/edit`)}
              testId="details-edit"
            />
          )}
          {notification.status === "DRAFT" && canSubmit && (
            <Button text="Submit notification" appearance="primary" type="button" onClick={() => setOpenModal("submit")} testId="details-submit" />
          )}
          {notification.status === "DRAFT" && canCancel && (
            <Button text="Cancel notification" appearance="ghost" color="red" type="button" onClick={() => setOpenModal("cancel")} testId="details-cancel" />
          )}
          {notification.status === "SUBMITTED" && canAccept && (
            <Button text="Accept notification" appearance="primary" type="button" onClick={() => setOpenModal("accept")} testId="details-accept" />
          )}
          {notification.status === "SUBMITTED" && canReturn && (
            <Button text="Return for correction" appearance="ghost" color="red" type="button" onClick={() => setOpenModal("return")} testId="details-return" />
          )}
          {notification.status === "ACCEPTED" && canConvert && (
            <div>
              <Button
                text="Convert to registration"
                appearance="primary"
                type="button"
                disabled={!eligibleForConvert}
                onClick={() => setOpenModal("convert")}
                testId="details-convert"
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

      <SubmitNotificationModal
        show={openModal === "submit"}
        onClose={() => setOpenModal(undefined)}
        notification={notification}
        onSubmitted={(updated) => {
          setOpenModal(undefined);
          setNotification(updated);
        }}
      />
      <CancelNotificationModal
        show={openModal === "cancel"}
        onClose={() => setOpenModal(undefined)}
        notification={notification}
        onCancelled={(updated) => {
          setOpenModal(undefined);
          setNotification(updated);
        }}
      />
      <AcceptNotificationModal
        show={openModal === "accept"}
        onClose={() => setOpenModal(undefined)}
        notification={notification}
        onAccepted={(updated) => {
          setOpenModal(undefined);
          setNotification(updated);
        }}
      />
      <ReturnNotificationModal
        show={openModal === "return"}
        onClose={() => setOpenModal(undefined)}
        notification={notification}
        onReturned={(updated) => {
          setOpenModal(undefined);
          setNotification(updated);
        }}
      />
      <ConvertToRegistrationModal show={openModal === "convert"} onClose={() => setOpenModal(undefined)} notification={notification} />
    </div>
  );
}
