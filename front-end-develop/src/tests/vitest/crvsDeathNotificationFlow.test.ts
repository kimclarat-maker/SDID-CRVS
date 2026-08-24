import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDemoData } from "@/demo/storage/demoStore";
import {
  demoCreateDeathNotificationDraft,
  demoUpdateDeathNotificationDraft,
  demoSubmitDeathNotification,
  demoReturnDeathNotification,
  demoAcceptDeathNotification,
  demoCancelDeathNotification,
  canConvertDeathNotification,
  demoGetDeathNotification,
} from "@/demo/services/crvsDeathNotifications";
import { IllegalTransitionError } from "@/domain/crvs/statusMachines";

const draftInput = {
  pathway: "HEALTH_FACILITY" as const,
  facilityId: "FAC-DEMO-01",
  facilityName: "Demo District Health Centre",
  deceased: {
    identityStatus: "KNOWN" as const,
    firstName: "Test",
    lastName: "Deceased",
    sex: "MALE" as const,
    nationality: "Demo Republic",
    documentType: "NATIONAL_ID" as const,
    documentNumber: "DEMO-ID-999911",
    verification: "NOT_VERIFIED" as const,
  },
  occurrence: {
    dateOfDeath: new Date().toISOString(),
    placeCategory: "HEALTH_FACILITY" as const,
    facilityId: "FAC-DEMO-01",
    facilityName: "Demo District Health Centre",
    location: "Demo District Health Centre",
    adminLocation: "Demo District",
    jurisdiction: "Demo District",
    circumstanceCategory: "NATURAL_ILLNESS" as const,
  },
};

describe("Death notification flow: create -> save -> edit -> submit -> accept -> convert", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("walks the full happy path and becomes eligible for conversion", async () => {
    const draft = demoCreateDeathNotificationDraft(draftInput, "death.notifier@demo.identity.local", "Test Death Notifier");
    expect(draft.status).toBe("DRAFT");
    expect(draft.reference).toMatch(/^DN-DEMO-\d{4}-\d{4}$/);

    const edited = demoUpdateDeathNotificationDraft(draft.id, { facilityName: "Updated Facility" }, "Test Death Notifier");
    expect(edited.facilityName).toBe("Updated Facility");
    expect(edited.version).toBe(2);

    const submitted = demoSubmitDeathNotification(draft.id, "Test Death Notifier");
    expect(submitted.status).toBe("SUBMITTED");
    expect(submitted.submittedAt).toBeTruthy();

    const accepted = demoAcceptDeathNotification(draft.id, "Test Registration Officer");
    expect(accepted.status).toBe("ACCEPTED");
    expect(canConvertDeathNotification(accepted)).toBe(true);

    const fetched = await demoGetDeathNotification(draft.id);
    expect(fetched?.status).toBe("ACCEPTED");

    const auditActions = getDemoData()
      .auditEvents.filter((e) => e.targetRef === draft.reference)
      .map((e) => e.action);
    expect(auditActions).toEqual(expect.arrayContaining(["created draft", "submitted", "accepted"]));
  });

  it("supports the return-and-resubmit correction path", () => {
    const draft = demoCreateDeathNotificationDraft(draftInput, "death.notifier@demo.identity.local", "Test Death Notifier");
    demoSubmitDeathNotification(draft.id, "Test Death Notifier");

    const returned = demoReturnDeathNotification(
      draft.id,
      { reason: "Missing medical certification", fields: ["Medical certification"], note: "Attach the certificate reference." },
      "Test Registration Officer"
    );
    expect(returned.status).toBe("RETURNED");
    expect(returned.returnReason?.reason).toBe("Missing medical certification");

    demoUpdateDeathNotificationDraft(draft.id, {
      medicalCertification: { isCertified: true, certifierName: "Dr. Test", cause: { immediateCause: "Cardiac arrest" } },
    }, "Test Death Notifier");

    const resubmitted = demoSubmitDeathNotification(draft.id, "Test Death Notifier");
    expect(resubmitted.status).toBe("SUBMITTED");
  });

  it("cancels only unsubmitted drafts, never permanently deleting the record", () => {
    const draft = demoCreateDeathNotificationDraft(draftInput, "death.notifier@demo.identity.local", "Test Death Notifier");
    const cancelled = demoCancelDeathNotification(draft.id, "Created in error.", "Test Death Notifier");
    expect(cancelled.status).toBe("CANCELLED");
    expect(getDemoData().crvsDeathNotifications.some((n) => n.id === draft.id)).toBe(true);
  });

  it("does not allow cancelling an already-submitted notification", () => {
    const draft = demoCreateDeathNotificationDraft(draftInput, "death.notifier@demo.identity.local", "Test Death Notifier");
    demoSubmitDeathNotification(draft.id, "Test Death Notifier");
    expect(() => demoCancelDeathNotification(draft.id, "Too late", "Test Death Notifier")).toThrow(IllegalTransitionError);
  });

  it("supports the unidentified-person pathway with no named deceased", () => {
    const draft = demoCreateDeathNotificationDraft(
      {
        pathway: "UNIDENTIFIED",
        deceased: { identityStatus: "IDENTITY_UNKNOWN", sex: "UNKNOWN", verification: "MANUAL_REVIEW_REQUIRED", descriptivePhysicalSummary: "Adult male, approx. 40 years." },
        occurrence: { ...draftInput.occurrence, placeCategory: "PUBLIC_PLACE" },
      },
      "death.notifier@demo.identity.local",
      "Test Death Notifier"
    );
    expect(draft.deceased.identityStatus).toBe("IDENTITY_UNKNOWN");
    expect(draft.pathway).toBe("UNIDENTIFIED");
  });
});
