// SDID synchronization must be idempotent: retrying a failed sync (or, in
// theory, re-queuing an already-synced case) can never create a second
// FoundationalIdentity. The key is derived purely from the case id, so it's
// stable across every retry of the same case.
export function syncIdempotencyKey(registrationCaseId: string): string {
  return `SDID-SYNC-${registrationCaseId}`;
}
