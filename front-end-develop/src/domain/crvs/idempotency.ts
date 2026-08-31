// SDID synchronization must be idempotent: retrying a failed sync (or, in
// theory, re-queuing an already-synced case) can never create a second
// FoundationalIdentity. The key is derived purely from the case id, so it's
// stable across every retry of the same case.
export function syncIdempotencyKey(registrationCaseId: string): string {
  return `SDID-SYNC-${registrationCaseId}`;
}

// Marriage sync runs twice per case — once per spouse — so the key must be
// scoped per spouse as well as per case, or retrying one spouse's failed
// sync would collide with the other spouse's idempotency key.
export function marriageSyncIdempotencyKey(caseId: string, spouse: "APPLICANT1" | "APPLICANT2"): string {
  return `MARRIAGE-${syncIdempotencyKey(caseId)}-${spouse}`;
}

// Divorce sync also runs twice per case — once per former spouse — same
// per-spouse scoping reasoning as marriageSyncIdempotencyKey() above.
export function divorceSyncIdempotencyKey(caseId: string, spouse: "SPOUSE1" | "SPOUSE2"): string {
  return `DIVORCE-${syncIdempotencyKey(caseId)}-${spouse}`;
}

// Annulment sync also runs twice per case — once per affected party — same
// per-party scoping reasoning as marriageSyncIdempotencyKey() above.
export function annulmentSyncIdempotencyKey(caseId: string, party: "PARTY_1" | "PARTY_2"): string {
  return `ANNULMENT-${syncIdempotencyKey(caseId)}-${party}`;
}
