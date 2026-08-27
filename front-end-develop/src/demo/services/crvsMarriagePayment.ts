// Demo-only payment state machine for the conditional fee/payment wizard
// step (spec §5 step 9) — no real payment provider is ever integrated.
// Amount/currency/special-day surcharge all read from marriagePolicyConfig;
// nothing here hardcodes a fee number.
import { demoDelay } from "../config";
import { updateDemoData } from "../storage/demoStore";
import { MarriageApplication } from "@/domain/crvs/types";
import { feeFor, marriagePolicyConfig } from "@/domain/crvs/marriagePolicyConfig";
import { logCrvsAudit } from "./crvsAudit";
import { NotFoundError } from "./crvsErrors";
import { demoApproveMarriageApplicationAfterPayment } from "./crvsMarriageApplications";

const DEMO_PAYMENT_SUCCESS_RATE = 0.85;

export const demoInitiateMarriagePayment = (
  applicationId: string,
  isExceptionCase: boolean,
  actorName: string
): MarriageApplication => {
  let result: MarriageApplication | undefined;
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === applicationId);
    if (!app) throw new NotFoundError("Marriage application");
    if (!marriagePolicyConfig.payment.required) {
      app.payment.status = "NOT_REQUIRED";
      return db;
    }
    const amount = feeFor(app.proposedMarriageDate || new Date().toISOString(), isExceptionCase);
    app.payment.amount = amount;
    app.payment.currency = marriagePolicyConfig.payment.currency;
    app.payment.isSpecialDayFee = app.isSpecialDayRequest;
    app.payment.status = "PENDING";
    app.updatedAt = new Date().toISOString();
    app.version += 1;
    logCrvsAudit(db, actorName, "initiated payment", "crvs.marriage_payment", app.reference, `Fee ${amount} ${marriagePolicyConfig.payment.currency} pending.`);
    result = app;
    return db;
  });
  return result!;
};

export type DemoPaymentMethod = "DEMO_MOBILE_MONEY" | "DEMO_CARD" | "DEMO_BANK_TRANSFER";

/** Simulates a payment attempt — succeeds most of the time, occasionally
 * fails so the retry/failed states are reachable in the demo. Never a real
 * payment call. */
export const demoAttemptMarriagePayment = async (
  applicationId: string,
  method: DemoPaymentMethod,
  actorName: string
): Promise<{ outcome: "SUCCESS" | "FAILED"; application: MarriageApplication }> => {
  await demoDelay(null, 1200);

  const succeeded = Math.random() < DEMO_PAYMENT_SUCCESS_RATE;
  let app: MarriageApplication | undefined;
  updateDemoData((db) => {
    const found = db.crvsMarriageApplications.find((a) => a.id === applicationId);
    if (!found) throw new NotFoundError("Marriage application");
    const now = new Date().toISOString();
    if (succeeded) {
      found.payment.status = "PAID";
      found.payment.method = method;
      found.payment.reference = `PAY-DEMO-${Date.now()}`;
      found.payment.paidAt = now;
      found.payment.attempts.push({ at: now, outcome: "SUCCESS" });
      logCrvsAudit(db, actorName, "payment succeeded", "crvs.marriage_payment", found.reference, `${method} — ${found.payment.amount} ${found.payment.currency}.`);
    } else {
      found.payment.status = "FAILED";
      found.payment.attempts.push({ at: now, outcome: "FAILED", failureReason: "Demo payment provider declined the transaction." });
      logCrvsAudit(db, actorName, "payment failed", "crvs.marriage_payment", found.reference, "Demo payment provider declined the transaction.");
    }
    found.updatedAt = now;
    found.version += 1;
    app = found;
    return db;
  });

  if (succeeded) {
    app = demoApproveMarriageApplicationAfterPayment(applicationId, actorName);
  }
  return { outcome: succeeded ? "SUCCESS" : "FAILED", application: app! };
};

export const demoCancelMarriagePayment = (applicationId: string, actorName: string): MarriageApplication => {
  let result: MarriageApplication | undefined;
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === applicationId);
    if (!app) throw new NotFoundError("Marriage application");
    const now = new Date().toISOString();
    app.payment.status = "CANCELLED";
    app.payment.attempts.push({ at: now, outcome: "CANCELLED" });
    app.updatedAt = now;
    app.version += 1;
    logCrvsAudit(db, actorName, "payment cancelled", "crvs.marriage_payment", app.reference, "Applicant cancelled the payment attempt.");
    result = app;
    return db;
  });
  return result!;
};

export const demoWaiveMarriagePayment = (applicationId: string, reason: string, actorName: string): MarriageApplication => {
  let result: MarriageApplication | undefined;
  updateDemoData((db) => {
    const app = db.crvsMarriageApplications.find((a) => a.id === applicationId);
    if (!app) throw new NotFoundError("Marriage application");
    app.payment.status = "WAIVED";
    app.payment.waivedBy = actorName;
    app.payment.waivedReason = reason;
    app.updatedAt = new Date().toISOString();
    app.version += 1;
    logCrvsAudit(db, actorName, "waived payment", "crvs.marriage_payment", app.reference, reason);
    result = app;
    return db;
  });
  return result!;
};
