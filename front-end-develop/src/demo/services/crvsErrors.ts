// Shared across every CRVS demo service so every mutation can check the
// expected version before writing (spec §22: "Every mutation checks the
// expected version") and callers get one recognizable error type to branch
// on for the "case updated by another user" recoverable-error state.
export class ConcurrencyError extends Error {
  constructor(entity: string) {
    super(`${entity} was updated by another user. Reload and try again.`);
    this.name = "ConcurrencyError";
  }
}

export class NotFoundError extends Error {
  constructor(entity: string) {
    super(`${entity} was not found.`);
    this.name = "NotFoundError";
  }
}

/** Thrown when a marriage-appointment scheduling/reschedule mutation would
 * push a office+date slot past its configured capacity — caught at write
 * time inside the single updateDemoData() mutation, not pre-checked and
 * then written separately, so two concurrent bookings can never both
 * succeed against the same over-capacity slot. */
export class SlotUnavailableError extends Error {
  constructor(message = "This appointment slot is no longer available. Choose a different date or office.") {
    super(message);
    this.name = "SlotUnavailableError";
  }
}
