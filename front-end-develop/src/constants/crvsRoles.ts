// CRVS roles/permissions live separately from the SDID DemoRole/ROLE_PERMISSIONS
// maps in src/demo/session.ts — the two workspaces have independent role
// vocabularies and neither should influence the other's shape.
export const CRVS_ROLES = {
  BIRTH_NOTIFICATION_OFFICER: "BIRTH_NOTIFICATION_OFFICER",
  CRVS_REGISTRATION_OFFICER: "CRVS_REGISTRATION_OFFICER",
  CIVIL_REGISTRAR: "CIVIL_REGISTRAR",
  CRVS_SUPERVISOR: "CRVS_SUPERVISOR",
} as const;

export type CrvsRole = (typeof CRVS_ROLES)[keyof typeof CRVS_ROLES];

// Dot-namespaced rather than the legacy get_<module> pattern used by SDID's
// defineAccess() — there's no existing backend contract to match here, and
// the spec asks for names the backend can later enforce as-is.
export const CRVS_PERMISSIONS = {
  BIRTH_NOTIFICATION_CREATE: "crvs.birth_notification.create",
  BIRTH_NOTIFICATION_VIEW: "crvs.birth_notification.view",
  BIRTH_NOTIFICATION_EDIT: "crvs.birth_notification.edit",
  BIRTH_NOTIFICATION_SUBMIT: "crvs.birth_notification.submit",
  BIRTH_NOTIFICATION_CANCEL: "crvs.birth_notification.cancel",
  BIRTH_NOTIFICATION_RETURN: "crvs.birth_notification.return",
  BIRTH_NOTIFICATION_ACCEPT: "crvs.birth_notification.accept",
  BIRTH_DRAFT_CREATE: "crvs.birth_draft.create",
  BIRTH_DRAFT_EDIT: "crvs.birth_draft.edit",
  REGISTRATION_CONVERT: "crvs.registration.convert",
  SDID_LOOKUP_VERIFY: "crvs.sdid_lookup.verify",
  EVIDENCE_ATTACH: "crvs.evidence.attach",
  EVIDENCE_REVIEW: "crvs.evidence.review",
  DUPLICATE_CHECK_RUN: "crvs.duplicate_check.run",
  DUPLICATE_CHECK_RESOLVE: "crvs.duplicate_check.resolve",
  REGISTRATION_SUBMIT: "crvs.registration.submit",
  REGISTRATION_VIEW: "crvs.registration.view",
  REGISTRATION_APPROVE: "crvs.registration.approve",
  REGISTRATION_REJECT: "crvs.registration.reject",
  CORRECTION_REQUEST: "crvs.correction.request",
  CORRECTION_RESPOND: "crvs.correction.respond",
  CASE_REASSIGN: "crvs.case.reassign",
  ESCALATION_REVIEW: "crvs.escalation.review",
  EXCEPTION_RESOLVE: "crvs.exception.resolve",
  LATE_REGISTRATION_REVIEW: "crvs.late_registration.review",
  SYNC_RETRY: "crvs.sync.retry",
  SYNC_MANUAL_REVIEW: "crvs.sync.manual_review",
  REGISTERED_VIEW: "crvs.registered.view",
  AUDIT_VIEW: "crvs.audit.view",
  WORKLOAD_VIEW: "crvs.workload.view",
  ANALYTICS_VIEW: "crvs.analytics.view",
  EXCEPTIONS_VIEW: "crvs.exceptions.view",
} as const;

export type CrvsPermission = (typeof CRVS_PERMISSIONS)[keyof typeof CRVS_PERMISSIONS];

export const CRVS_ROLE_PERMISSIONS: Record<CrvsRole, CrvsPermission[]> = {
  // Create, edit, submit and cancel their facility's birth notifications,
  // and respond to returned-notification corrections. No approval authority,
  // no registration authority, no SDID workspace access (spec §2).
  BIRTH_NOTIFICATION_OFFICER: [
    CRVS_PERMISSIONS.BIRTH_NOTIFICATION_CREATE,
    CRVS_PERMISSIONS.BIRTH_NOTIFICATION_VIEW,
    CRVS_PERMISSIONS.BIRTH_NOTIFICATION_EDIT,
    CRVS_PERMISSIONS.BIRTH_NOTIFICATION_SUBMIT,
    CRVS_PERMISSIONS.BIRTH_NOTIFICATION_CANCEL,
  ],
  // Accept notifications, convert to registration, create/edit drafts
  // (including direct community/late registrations), verify identities via
  // SDID lookup, attach evidence, run duplicate checks, submit
  // registrations, respond to corrections. No approval authority, no
  // high-risk exception resolution, no full SDID workspace.
  CRVS_REGISTRATION_OFFICER: [
    CRVS_PERMISSIONS.BIRTH_NOTIFICATION_VIEW,
    CRVS_PERMISSIONS.BIRTH_NOTIFICATION_ACCEPT,
    CRVS_PERMISSIONS.BIRTH_NOTIFICATION_RETURN,
    CRVS_PERMISSIONS.REGISTRATION_CONVERT,
    CRVS_PERMISSIONS.BIRTH_DRAFT_CREATE,
    CRVS_PERMISSIONS.BIRTH_DRAFT_EDIT,
    CRVS_PERMISSIONS.SDID_LOOKUP_VERIFY,
    CRVS_PERMISSIONS.EVIDENCE_ATTACH,
    CRVS_PERMISSIONS.DUPLICATE_CHECK_RUN,
    CRVS_PERMISSIONS.REGISTRATION_SUBMIT,
    CRVS_PERMISSIONS.REGISTRATION_VIEW,
    CRVS_PERMISSIONS.CORRECTION_RESPOND,
  ],
  // View assigned/unassigned queues, start review, review every section,
  // verify evidence, review duplicates, request corrections, approve or
  // reject, view audit history. Must not approve a case they created or are
  // personally involved in, or outside their jurisdiction — see
  // utils/workspace/crvsRules.ts. Never gains authority from an SDID
  // SUPERADMIN assignment (that bypass is explicitly SDID-only).
  CIVIL_REGISTRAR: [
    CRVS_PERMISSIONS.REGISTRATION_VIEW,
    CRVS_PERMISSIONS.EVIDENCE_REVIEW,
    CRVS_PERMISSIONS.DUPLICATE_CHECK_RESOLVE,
    CRVS_PERMISSIONS.CORRECTION_REQUEST,
    CRVS_PERMISSIONS.REGISTRATION_APPROVE,
    CRVS_PERMISSIONS.REGISTRATION_REJECT,
    CRVS_PERMISSIONS.AUDIT_VIEW,
    CRVS_PERMISSIONS.REGISTERED_VIEW,
  ],
  // Review late registrations and exceptions, resolve potential duplicates,
  // reassign cases, view workload, retry failed SDID synchronization, place
  // cases into manual review, view audit history. No routine data entry or
  // Civil Registrar approval authority unless separately assigned.
  CRVS_SUPERVISOR: [
    CRVS_PERMISSIONS.REGISTRATION_VIEW,
    CRVS_PERMISSIONS.WORKLOAD_VIEW,
    CRVS_PERMISSIONS.ANALYTICS_VIEW,
    CRVS_PERMISSIONS.EXCEPTIONS_VIEW,
    CRVS_PERMISSIONS.LATE_REGISTRATION_REVIEW,
    CRVS_PERMISSIONS.CASE_REASSIGN,
    CRVS_PERMISSIONS.ESCALATION_REVIEW,
    CRVS_PERMISSIONS.EXCEPTION_RESOLVE,
    CRVS_PERMISSIONS.DUPLICATE_CHECK_RESOLVE,
    CRVS_PERMISSIONS.SYNC_RETRY,
    CRVS_PERMISSIONS.SYNC_MANUAL_REVIEW,
    CRVS_PERMISSIONS.AUDIT_VIEW,
    CRVS_PERMISSIONS.REGISTERED_VIEW,
  ],
};

export const CRVS_ROLE_LABELS: Record<CrvsRole, string> = {
  BIRTH_NOTIFICATION_OFFICER: "Birth Notification Officer",
  CRVS_REGISTRATION_OFFICER: "CRVS Registration Officer",
  CIVIL_REGISTRAR: "Civil Registrar",
  CRVS_SUPERVISOR: "CRVS Supervisor",
};
