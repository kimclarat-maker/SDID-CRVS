import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDemoData } from "@/demo/storage/demoStore";
import {
  demoCreateNotificationDraft,
  demoUpdateNotificationDraft,
  demoSubmitNotification,
  demoReturnNotification,
  demoAcceptNotification,
  demoCancelNotification,
  canConvertNotification,
  demoGetNotification,
} from "@/demo/services/crvsNotifications";
import { IllegalTransitionError } from "@/domain/crvs/statusMachines";

const draftInput = {
  facilityId: "FAC-DEMO-01",
  facilityName: "Demo District Health Centre",
  occurrenceType: "FACILITY" as const,
  child: {
    lastName: "Testchild",
    sex: "FEMALE" as const,
    dateOfBirth: new Date().toISOString(),
    placeOfBirth: "Demo District Health Centre",
    multipleBirth: { isMultiple: false },
  },
  mother: {
    firstName: "Test",
    lastName: "Mother",
    documentType: "NATIONAL_ID" as const,
    documentNumber: "DEMO-ID-999901",
    nationality: "Demo Republic",
    verification: "NOT_VERIFIED" as const,
  },
  father: { availability: "NOT_DECLARED" as const },
};

describe("Birth notification flow: create -> save -> edit -> submit -> accept -> convert", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("walks the full happy path and becomes eligible for conversion", async () => {
    const draft = demoCreateNotificationDraft(draftInput, "notifier@demo.identity.local", "Test Notifier");
    expect(draft.status).toBe("DRAFT");
    expect(draft.reference).toMatch(/^BN-DEMO-\d{4}-\d{4}$/);

    const edited = demoUpdateNotificationDraft(draft.id, { sourceReference: "SRC-REF-1" }, "Test Notifier");
    expect(edited.sourceReference).toBe("SRC-REF-1");
    expect(edited.version).toBe(2);

    const submitted = demoSubmitNotification(draft.id, "Test Notifier");
    expect(submitted.status).toBe("SUBMITTED");
    expect(submitted.submittedAt).toBeTruthy();

    const accepted = demoAcceptNotification(draft.id, "Test Registration Officer");
    expect(accepted.status).toBe("ACCEPTED");
    expect(canConvertNotification(accepted)).toBe(true);

    const fetched = await demoGetNotification(draft.id);
    expect(fetched?.status).toBe("ACCEPTED");

    const auditActions = getDemoData()
      .auditEvents.filter((e) => e.targetRef === draft.reference)
      .map((e) => e.action);
    expect(auditActions).toEqual(expect.arrayContaining(["created draft", "submitted", "accepted"]));
  });

  it("supports the return-and-resubmit correction path", () => {
    const draft = demoCreateNotificationDraft(draftInput, "notifier@demo.identity.local", "Test Notifier");
    demoSubmitNotification(draft.id, "Test Notifier");

    const returned = demoReturnNotification(
      draft.id,
      { reason: "Missing information", fields: ["Mother's document number"], note: "Please confirm the ID number." },
      "Test Registration Officer"
    );
    expect(returned.status).toBe("RETURNED");
    expect(returned.returnReason?.reason).toBe("Missing information");

    demoUpdateNotificationDraft(draft.id, {
      mother: { ...draftInput.mother, documentNumber: "DEMO-ID-999902" },
    }, "Test Notifier");

    const resubmitted = demoSubmitNotification(draft.id, "Test Notifier");
    expect(resubmitted.status).toBe("SUBMITTED");
  });

  it("cancels only unsubmitted drafts, never permanently deleting the record", () => {
    const draft = demoCreateNotificationDraft(draftInput, "notifier@demo.identity.local", "Test Notifier");
    const cancelled = demoCancelNotification(draft.id, "Created in error.", "Test Notifier");
    expect(cancelled.status).toBe("CANCELLED");
    expect(getDemoData().crvsNotifications.some((n) => n.id === draft.id)).toBe(true);
  });

  it("does not allow cancelling an already-submitted notification", () => {
    const draft = demoCreateNotificationDraft(draftInput, "notifier@demo.identity.local", "Test Notifier");
    demoSubmitNotification(draft.id, "Test Notifier");
    expect(() => demoCancelNotification(draft.id, "Too late", "Test Notifier")).toThrow(IllegalTransitionError);
  });

  it("an ACCEPTED notification already converted is no longer eligible for conversion", () => {
    const draft = demoCreateNotificationDraft(draftInput, "notifier@demo.identity.local", "Test Notifier");
    demoSubmitNotification(draft.id, "Test Notifier");
    const accepted = demoAcceptNotification(draft.id, "Test Registration Officer");
    expect(canConvertNotification({ ...accepted, convertedToRegistrationId: "BR-999" })).toBe(false);
  });
});
