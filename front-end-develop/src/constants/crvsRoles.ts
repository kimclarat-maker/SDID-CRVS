// CRVS roles/permissions live separately from the SDID DemoRole/ROLE_PERMISSIONS
// maps in src/demo/session.ts — the two workspaces have independent role
// vocabularies and neither should influence the other's shape.
export const CRVS_ROLES = {
  BIRTH_NOTIFICATION_OFFICER: "BIRTH_NOTIFICATION_OFFICER",
  CRVS_REGISTRATION_OFFICER: "CRVS_REGISTRATION_OFFICER",
  CIVIL_REGISTRAR: "CIVIL_REGISTRAR",
  CRVS_SUPERVISOR: "CRVS_SUPERVISOR",
  // Certificate template/fee/validity/delivery/permission configuration only
  // (spec §3/§35) — deliberately narrow. Platform administration must never
  // itself grant certificate approval, issuance, revocation or waiver
  // authority, so this role carries none of those permissions below.
  PLATFORM_ADMINISTRATOR: "PLATFORM_ADMINISTRATOR",
  // Death-workflow roles. CRVS_REGISTRATION_OFFICER/CIVIL_REGISTRAR/
  // CRVS_SUPERVISOR are reused (extended below) rather than duplicated —
  // only the three genuinely new death-specific roles are added here.
  DEATH_NOTIFICATION_OFFICER: "DEATH_NOTIFICATION_OFFICER",
  MEDICAL_CERTIFIER: "MEDICAL_CERTIFIER",
  CRVS_AUDITOR: "CRVS_AUDITOR",
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

  // Birth-certificate request/issuance/delivery/verification lifecycle
  // (spec §4). The five marked "legally or operationally restricted" in the
  // spec — review.approve, issue, revoke, replace, payment.waive — are
  // wired below to only the specific roles the spec authorizes, never to a
  // bypass.
  CERTIFICATE_DASHBOARD_VIEW: "crvs.certificate.dashboard.view",
  CERTIFICATE_REQUEST_VIEW: "crvs.certificate.request.view",
  CERTIFICATE_REQUEST_CREATE: "crvs.certificate.request.create",
  CERTIFICATE_REQUEST_SUBMIT: "crvs.certificate.request.submit",
  CERTIFICATE_REQUEST_ASSIST: "crvs.certificate.request.assist",
  CERTIFICATE_RECORD_LOOKUP: "crvs.certificate.record.lookup",
  CERTIFICATE_REQUESTER_VERIFY: "crvs.certificate.requester.verify",
  CERTIFICATE_PAYMENT_VIEW: "crvs.certificate.payment.view",
  CERTIFICATE_PAYMENT_RECORD: "crvs.certificate.payment.record",
  CERTIFICATE_PAYMENT_WAIVE: "crvs.certificate.payment.waive",
  CERTIFICATE_REVIEW_VIEW: "crvs.certificate.review.view",
  CERTIFICATE_REVIEW_START: "crvs.certificate.review.start",
  CERTIFICATE_REVIEW_APPROVE: "crvs.certificate.review.approve",
  CERTIFICATE_REVIEW_REJECT: "crvs.certificate.review.reject",
  CERTIFICATE_REVIEW_HOLD: "crvs.certificate.review.hold",
  CERTIFICATE_ISSUE: "crvs.certificate.issue",
  CERTIFICATE_DOWNLOAD: "crvs.certificate.download",
  CERTIFICATE_DELIVER: "crvs.certificate.deliver",
  CERTIFICATE_DELIVERY_RETRY: "crvs.certificate.delivery.retry",
  CERTIFICATE_REVOKE: "crvs.certificate.revoke",
  CERTIFICATE_REPLACE: "crvs.certificate.replace",
  CERTIFICATE_REISSUE: "crvs.certificate.reissue",
  CERTIFICATE_AUDIT_VIEW: "crvs.certificate.audit.view",
  CERTIFICATE_CONFIGURATION_MANAGE: "crvs.certificate.configuration.manage",

  // Death notification/registration lifecycle. Same dot-namespace family as
  // everything above, mapped from the spec's death.* permission list.
  DEATH_NOTIFICATION_CREATE: "crvs.death_notification.create",
  DEATH_NOTIFICATION_VIEW: "crvs.death_notification.view",
  DEATH_NOTIFICATION_EDIT: "crvs.death_notification.edit",
  DEATH_NOTIFICATION_SUBMIT: "crvs.death_notification.submit",
  DEATH_NOTIFICATION_CANCEL: "crvs.death_notification.cancel",
  DEATH_NOTIFICATION_RETURN: "crvs.death_notification.return",
  DEATH_NOTIFICATION_ACCEPT: "crvs.death_notification.accept",
  DEATH_DRAFT_CREATE: "crvs.death_draft.create",
  DEATH_DRAFT_EDIT: "crvs.death_draft.edit",
  DEATH_REGISTRATION_CONVERT: "crvs.death_registration.convert",
  DEATH_REGISTRATION_SUBMIT: "crvs.death_registration.submit",
  DEATH_REGISTRATION_VIEW: "crvs.death_registration.view",
  DEATH_REGISTRATION_REVIEW: "crvs.death_registration.review",
  DEATH_CORRECTION_REQUEST: "crvs.death_registration.request_correction",
  DEATH_CORRECTION_RESPOND: "crvs.death_registration.respond_correction",
  DEATH_REGISTRATION_APPROVE: "crvs.death_registration.approve",
  DEATH_REGISTRATION_REJECT: "crvs.death_registration.reject",
  DEATH_REGISTRATION_REGISTER: "crvs.death_registration.register",
  DEATH_LATE_REVIEW: "crvs.death.late_review",
  DEATH_MEDICO_LEGAL_REVIEW: "crvs.death.medico_legal_review",
  DEATH_UNIDENTIFIED_REVIEW: "crvs.death.unidentified_review",
  DEATH_CAUSE_VIEW: "crvs.death.cause.view",
  DEATH_CAUSE_EDIT: "crvs.death.cause.edit",
  DEATH_SDID_SYNC_VIEW: "crvs.death.sdid_sync.view",
  DEATH_SDID_SYNC_RETRY: "crvs.death.sdid_sync.retry",
  DEATH_CERTIFICATE_REQUEST: "crvs.death.certificate.request",
  DEATH_AUDIT_VIEW: "crvs.death.audit.view",
  DEATH_CASE_REASSIGN: "crvs.death.case.reassign",
  DEATH_EXCEPTIONS_VIEW: "crvs.death.exceptions.view",
  DEATH_DUPLICATE_RESOLVE: "crvs.death.duplicate.resolve",
  DEATH_IDENTITY_SEARCH: "crvs.death.identity_search.run",
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
    // Certificate requests: create/assist assisted requests, search records
    // within scope, verify requesters, submit, record payment or apply a
    // configured waiver, view status, retry permitted delivery actions. No
    // approval, no issuance, no revocation (spec §3).
    CRVS_PERMISSIONS.CERTIFICATE_DASHBOARD_VIEW,
    CRVS_PERMISSIONS.CERTIFICATE_REQUEST_VIEW,
    CRVS_PERMISSIONS.CERTIFICATE_REQUEST_CREATE,
    CRVS_PERMISSIONS.CERTIFICATE_REQUEST_SUBMIT,
    CRVS_PERMISSIONS.CERTIFICATE_REQUEST_ASSIST,
    CRVS_PERMISSIONS.CERTIFICATE_RECORD_LOOKUP,
    CRVS_PERMISSIONS.CERTIFICATE_REQUESTER_VERIFY,
    CRVS_PERMISSIONS.CERTIFICATE_PAYMENT_VIEW,
    CRVS_PERMISSIONS.CERTIFICATE_PAYMENT_RECORD,
    CRVS_PERMISSIONS.CERTIFICATE_PAYMENT_WAIVE,
    CRVS_PERMISSIONS.CERTIFICATE_DELIVERY_RETRY,
    // Death workflow: accept/return death notifications, create/edit death
    // registration drafts across every pathway, run identity/duplicate
    // checks, attach evidence, submit registrations, respond to
    // corrections, request a death certificate. No approval/registration
    // authority, no cause-of-death visibility (that's MEDICAL_CERTIFIER's).
    CRVS_PERMISSIONS.DEATH_NOTIFICATION_VIEW,
    CRVS_PERMISSIONS.DEATH_NOTIFICATION_ACCEPT,
    CRVS_PERMISSIONS.DEATH_NOTIFICATION_RETURN,
    CRVS_PERMISSIONS.DEATH_REGISTRATION_CONVERT,
    CRVS_PERMISSIONS.DEATH_DRAFT_CREATE,
    CRVS_PERMISSIONS.DEATH_DRAFT_EDIT,
    CRVS_PERMISSIONS.DEATH_IDENTITY_SEARCH,
    CRVS_PERMISSIONS.DEATH_DUPLICATE_RESOLVE,
    CRVS_PERMISSIONS.DEATH_REGISTRATION_SUBMIT,
    CRVS_PERMISSIONS.DEATH_REGISTRATION_VIEW,
    CRVS_PERMISSIONS.DEATH_CORRECTION_RESPOND,
    CRVS_PERMISSIONS.DEATH_CERTIFICATE_REQUEST,
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
    // Certificate requests: review requests needing manual review, resolve
    // mismatches, approve/reject exceptional requests (never their own
    // conflicted request — see utils/workspace/crvsRules.ts), confirm the
    // certificate reflects the registered record, place on hold. No
    // revocation/replacement authority (spec §3).
    CRVS_PERMISSIONS.CERTIFICATE_DASHBOARD_VIEW,
    CRVS_PERMISSIONS.CERTIFICATE_REQUEST_VIEW,
    CRVS_PERMISSIONS.CERTIFICATE_REVIEW_VIEW,
    CRVS_PERMISSIONS.CERTIFICATE_REVIEW_START,
    CRVS_PERMISSIONS.CERTIFICATE_REVIEW_APPROVE,
    CRVS_PERMISSIONS.CERTIFICATE_REVIEW_REJECT,
    CRVS_PERMISSIONS.CERTIFICATE_REVIEW_HOLD,
    CRVS_PERMISSIONS.CERTIFICATE_ISSUE,
    CRVS_PERMISSIONS.CERTIFICATE_AUDIT_VIEW,
    // Death workflow: review, request correction, view cause of death,
    // approve/reject/register, route to late/medico-legal/unidentified
    // review, view death audit history. Subject to the same maker-checker
    // and jurisdiction gates as birth — see canApproveDeathCase().
    CRVS_PERMISSIONS.DEATH_REGISTRATION_VIEW,
    CRVS_PERMISSIONS.DEATH_REGISTRATION_REVIEW,
    CRVS_PERMISSIONS.DEATH_CORRECTION_REQUEST,
    CRVS_PERMISSIONS.DEATH_CAUSE_VIEW,
    CRVS_PERMISSIONS.DEATH_REGISTRATION_APPROVE,
    CRVS_PERMISSIONS.DEATH_REGISTRATION_REJECT,
    CRVS_PERMISSIONS.DEATH_REGISTRATION_REGISTER,
    CRVS_PERMISSIONS.DEATH_LATE_REVIEW,
    CRVS_PERMISSIONS.DEATH_MEDICO_LEGAL_REVIEW,
    CRVS_PERMISSIONS.DEATH_UNIDENTIFIED_REVIEW,
    CRVS_PERMISSIONS.DEATH_AUDIT_VIEW,
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
    // Certificate requests: review escalated requests, reassign, resolve
    // delivery/issuance failures, authorize revocation/replacement/reissue,
    // review audit history, manage configured fee-waiver exceptions
    // (spec §3).
    CRVS_PERMISSIONS.CERTIFICATE_DASHBOARD_VIEW,
    CRVS_PERMISSIONS.CERTIFICATE_REQUEST_VIEW,
    CRVS_PERMISSIONS.CERTIFICATE_REVIEW_VIEW,
    CRVS_PERMISSIONS.CERTIFICATE_PAYMENT_VIEW,
    CRVS_PERMISSIONS.CERTIFICATE_PAYMENT_WAIVE,
    CRVS_PERMISSIONS.CERTIFICATE_DELIVERY_RETRY,
    CRVS_PERMISSIONS.CERTIFICATE_ISSUE,
    CRVS_PERMISSIONS.CERTIFICATE_REVOKE,
    CRVS_PERMISSIONS.CERTIFICATE_REPLACE,
    CRVS_PERMISSIONS.CERTIFICATE_REISSUE,
    CRVS_PERMISSIONS.CERTIFICATE_AUDIT_VIEW,
    // Death workflow: late/medico-legal/unidentified-person review,
    // duplicate resolution, case reassignment, SDID sync retry + manual
    // review, exceptions view, death audit history. No routine death
    // registration authority or approval unless separately assigned.
    CRVS_PERMISSIONS.DEATH_REGISTRATION_VIEW,
    CRVS_PERMISSIONS.DEATH_LATE_REVIEW,
    CRVS_PERMISSIONS.DEATH_MEDICO_LEGAL_REVIEW,
    CRVS_PERMISSIONS.DEATH_UNIDENTIFIED_REVIEW,
    CRVS_PERMISSIONS.DEATH_DUPLICATE_RESOLVE,
    CRVS_PERMISSIONS.DEATH_CASE_REASSIGN,
    CRVS_PERMISSIONS.DEATH_SDID_SYNC_VIEW,
    CRVS_PERMISSIONS.DEATH_SDID_SYNC_RETRY,
    CRVS_PERMISSIONS.DEATH_EXCEPTIONS_VIEW,
    CRVS_PERMISSIONS.DEATH_AUDIT_VIEW,
  ],
  // Configure certificate templates, fee rules, validity/verification
  // settings, delivery channels; manage permissions. Deliberately carries
  // none of the legally-restricted certificate permissions — configuring
  // the workspace must never itself grant approval/issuance/revocation/
  // waiver authority (spec §3/§35).
  PLATFORM_ADMINISTRATOR: [
    CRVS_PERMISSIONS.CERTIFICATE_DASHBOARD_VIEW,
    CRVS_PERMISSIONS.CERTIFICATE_CONFIGURATION_MANAGE,
  ],
  // Create, view, edit, submit and cancel their facility's death
  // notifications, respond to returned-notification corrections. No
  // approval, no registration authority, no cause-of-death visibility.
  DEATH_NOTIFICATION_OFFICER: [
    CRVS_PERMISSIONS.DEATH_NOTIFICATION_CREATE,
    CRVS_PERMISSIONS.DEATH_NOTIFICATION_VIEW,
    CRVS_PERMISSIONS.DEATH_NOTIFICATION_EDIT,
    CRVS_PERMISSIONS.DEATH_NOTIFICATION_SUBMIT,
    CRVS_PERMISSIONS.DEATH_NOTIFICATION_CANCEL,
  ],
  // Views and edits only the medical-certification section of a
  // notification/registration they're attached to as certifier — cause of
  // death, certifying facility, certificate reference. No registration
  // drafting, no review/approval authority (spec §2).
  MEDICAL_CERTIFIER: [
    CRVS_PERMISSIONS.DEATH_NOTIFICATION_VIEW,
    CRVS_PERMISSIONS.DEATH_REGISTRATION_VIEW,
    CRVS_PERMISSIONS.DEATH_CAUSE_VIEW,
    CRVS_PERMISSIONS.DEATH_CAUSE_EDIT,
  ],
  // Read-only oversight: views death registrations and the death audit
  // trail. No create/edit/approve authority, and — like any role without
  // DEATH_CAUSE_VIEW — sees the restricted-cause-of-death notice rather
  // than medical detail (spec §2 "restricted to users with the explicit
  // permission").
  CRVS_AUDITOR: [
    CRVS_PERMISSIONS.DEATH_REGISTRATION_VIEW,
    CRVS_PERMISSIONS.DEATH_AUDIT_VIEW,
    CRVS_PERMISSIONS.AUDIT_VIEW,
  ],
};

export const CRVS_ROLE_LABELS: Record<CrvsRole, string> = {
  BIRTH_NOTIFICATION_OFFICER: "Birth Notification Officer",
  CRVS_REGISTRATION_OFFICER: "CRVS Registration Officer",
  CIVIL_REGISTRAR: "Civil Registrar",
  CRVS_SUPERVISOR: "CRVS Supervisor",
  PLATFORM_ADMINISTRATOR: "Platform Administrator",
  DEATH_NOTIFICATION_OFFICER: "Death Notification Officer",
  MEDICAL_CERTIFIER: "Medical Certifier",
  CRVS_AUDITOR: "CRVS Auditor",
};
