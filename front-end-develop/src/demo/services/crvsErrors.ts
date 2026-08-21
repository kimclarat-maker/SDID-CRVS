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
