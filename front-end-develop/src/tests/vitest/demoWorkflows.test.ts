import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDemoData, resetDemoData } from "@/demo/storage/demoStore";
import {
  demoApproveApplication,
  demoRejectApplication,
  demoListApplications,
} from "@/demo/services/applications";
import { demoTransferAppointment } from "@/demo/services/appointments";
import {
  demoTrackApplication,
  demoVerifyDocument,
  DEMO_TRACKING_REFERENCE,
  DEMO_TRACKING_CODE,
  DEMO_VERIFY_DOCUMENT_NUMBER,
  DEMO_VERIFY_CODE,
} from "@/demo/services/public";

describe("Reviewer approve/reject (Workflow A)", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("updates status, status history and the audit log on approval", async () => {
    const before = getDemoData();
    const pending = before.applications.find(
      (a) => a.status === "pendingReview"
    )!;

    await demoApproveApplication(pending.id, "Test Reviewer", "Looks good.");

    const after = getDemoData();
    const updated = after.applications.find((a) => a.id === pending.id)!;

    expect(updated.status).toBe("approved");
    expect(
      updated.statusHistory[updated.statusHistory.length - 1].status
    ).toBe("approved");
    expect(updated.reviewComments.at(-1)?.comment).toBe("Looks good.");
    expect(after.auditEvents[0].targetRef).toBe(updated.reference);
    expect(after.auditEvents[0].action).toBe("approved");
  });

  it("updates status on rejection and is reflected in a status-filtered list", async () => {
    const before = getDemoData();
    const pending = before.applications.find(
      (a) => a.status === "pendingReview"
    )!;

    await demoRejectApplication(pending.id, "Test Reviewer");

    const rejectedList = await demoListApplications({ status: "REJECTED" });
    expect(
      rejectedList.data.some((r: any) => r._id === pending.id)
    ).toBe(true);
  });
});

describe("Appointment transfer (Workflow C)", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("moves an appointment to a new centre and records transfer history", async () => {
    const before = getDemoData();
    const appt = before.appointments[0];
    const destination = before.centers.find((c) => c.id !== appt.centerId)!;

    await demoTransferAppointment(appt.id, destination.id);

    const after = getDemoData();
    const updated = after.appointments.find((a) => a.id === appt.id)!;

    expect(updated.centerId).toBe(destination.id);
    expect(updated.status).toBe("transferred");
    expect(updated.transferHistory.at(-1)?.toCenterId).toBe(destination.id);
  });
});

describe("Public tracking and document verification", () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoData();
  });
  afterEach(() => localStorage.clear());

  it("resolves the documented tracking example", () => {
    const result = demoTrackApplication(
      DEMO_TRACKING_REFERENCE,
      DEMO_TRACKING_CODE
    );
    expect(result).not.toBeNull();
    expect(result?.stages.length).toBeGreaterThan(0);
  });

  it("rejects a wrong verification code for tracking", () => {
    expect(demoTrackApplication(DEMO_TRACKING_REFERENCE, "000000")).toBeNull();
  });

  it("resolves the documented document-verification example without exposing a full record", () => {
    const result = demoVerifyDocument(
      DEMO_VERIFY_DOCUMENT_NUMBER,
      DEMO_VERIFY_CODE
    );
    expect(result?.valid).toBe(true);
    expect(result?.maskedHolderName).toMatch(/\*/);
  });

  it("rejects an unknown document number", () => {
    expect(
      demoVerifyDocument("CERT-DOES-NOT-EXIST", DEMO_VERIFY_CODE)
    ).toBeNull();
  });
});
