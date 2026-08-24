import { ActorReference } from "@/domain/crvs/types";
import { getCurrentAccountId } from "@/utils/workspace";
import { getCurrentActorName } from "../review/utils";

export { getCurrentActorName, maskId, formatDateTime, fullName } from "../review/utils";

/** The signed-in staff member as an ActorReference, the shape every
 * certificate service function records for createdBy/issuedBy/revokedBy/etc. */
export function getActorReference(): ActorReference {
  return { id: getCurrentAccountId() || getCurrentActorName(), name: getCurrentActorName() };
}

export function humanizeEnum(value: string | undefined | null): string {
  if (!value) return "—";
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function formatMoney(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString()}`;
}
