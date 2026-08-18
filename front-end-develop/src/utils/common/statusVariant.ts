export type StatusVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

const SUCCESS = ["active", "approved", "assigned", "verified", "complete", "completed"];
const WARNING = ["pending", "review_in_progress", "in review"];
const DANGER = ["inactive", "failed", "rejected", "exception"];
const INFO = ["in_progress", "in progress", "rollback", "roll back"];
const NEUTRAL = ["draft"];

export function getStatusVariant(status?: string): StatusVariant {
  const value = status?.toLowerCase()?.trim() || "";

  if (SUCCESS.includes(value)) return "success";
  if (WARNING.includes(value)) return "warning";
  if (DANGER.includes(value)) return "danger";
  if (INFO.includes(value)) return "info";
  if (NEUTRAL.includes(value)) return "neutral";

  return "neutral";
}
