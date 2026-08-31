// Central audit-log writer/reader for every CRVS birth-workflow action
// (spec §24). Reuses the same db.auditEvents collection SDID's demo mode
// already writes to (module + targetRef + actor + details), so there's one
// audit trail rather than a parallel CRVS-only one. Never logs passwords,
// tokens, or document binary content — only metadata/summary text.
import { DemoDatabase } from "../types";
import { getDemoData } from "../storage/demoStore";

export type CrvsAuditModule =
  | "crvs.notification"
  | "crvs.registration"
  | "crvs.evidence"
  | "crvs.identity_search"
  | "crvs.duplicate_check"
  | "crvs.review"
  | "crvs.correction"
  | "crvs.reassignment"
  | "crvs.exception"
  | "crvs.sync"
  | "crvs.certificate"
  | "crvs.certificate.payment"
  | "crvs.certificate.delivery"
  | "crvs.certificate.verification"
  | "crvs.death_notification"
  | "crvs.death_registration"
  | "crvs.death_review"
  | "crvs.death_correction"
  | "crvs.death_reassignment"
  | "crvs.death_exception"
  | "crvs.death_sync"
  | "crvs.death_identity_search"
  | "crvs.death_duplicate_check"
  | "crvs.marriage_application"
  | "crvs.marriage_partner_response"
  | "crvs.marriage_evidence"
  | "crvs.marriage_identity_search"
  | "crvs.marriage_duplicate_check"
  | "crvs.marriage_eligibility"
  | "crvs.marriage_payment"
  | "crvs.marriage_review"
  | "crvs.marriage_correction"
  | "crvs.marriage_reassignment"
  | "crvs.marriage_exception"
  | "crvs.marriage_objection"
  | "crvs.marriage_appointment"
  | "crvs.marriage_checkin"
  | "crvs.marriage_ceremony"
  | "crvs.marriage_registration"
  | "crvs.marriage_sync"
  | "crvs.marriage_certificate"
  | "crvs.divorce_notification"
  | "crvs.divorce_registration"
  | "crvs.divorce_evidence"
  | "crvs.divorce_identity_search"
  | "crvs.divorce_duplicate_check"
  | "crvs.divorce_review"
  | "crvs.divorce_judgment_verification"
  | "crvs.divorce_foreign_review"
  | "crvs.divorce_correction"
  | "crvs.divorce_reassignment"
  | "crvs.divorce_exception"
  | "crvs.divorce_registration_event"
  | "crvs.divorce_marriage_status_update"
  | "crvs.divorce_sync"
  | "crvs.divorce_certificate"
  | "crvs.annulment_notification"
  | "crvs.annulment_registration"
  | "crvs.annulment_evidence"
  | "crvs.annulment_identity_search"
  | "crvs.annulment_duplicate_check"
  | "crvs.annulment_review"
  | "crvs.annulment_decision_verification"
  | "crvs.annulment_legal_effect"
  | "crvs.annulment_foreign_review"
  | "crvs.annulment_correction"
  | "crvs.annulment_reassignment"
  | "crvs.annulment_exception"
  | "crvs.annulment_registration_event"
  | "crvs.annulment_marriage_status_update"
  | "crvs.annulment_sync"
  | "crvs.annulment_certificate";

export const logCrvsAudit = (
  db: DemoDatabase,
  actor: string,
  action: string,
  module: CrvsAuditModule,
  targetRef: string,
  details: string
): void => {
  db.auditEvents.unshift({
    id: `LOG-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    actor,
    action,
    module,
    targetRef,
    at: new Date().toISOString(),
    details,
  });
};

export const demoListCrvsAuditEvents = async (params: {
  targetRef?: string;
  module?: CrvsAuditModule;
  offset?: number;
  limit?: number;
}) => {
  const db = getDemoData();
  let events = db.auditEvents.filter((e) => e.module.startsWith("crvs."));
  if (params.targetRef) events = events.filter((e) => e.targetRef === params.targetRef);
  if (params.module) events = events.filter((e) => e.module === params.module);

  const total = events.length;
  const offset = params.offset || 0;
  const limit = params.limit || 50;
  return { data: events.slice(offset, offset + limit), total };
};
