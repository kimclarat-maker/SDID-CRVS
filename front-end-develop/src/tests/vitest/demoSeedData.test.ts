import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getDemoData,
  resetDemoData,
  setDemoData,
} from "@/demo/storage/demoStore";
import { DemoApplicationStatus } from "@/demo/types";

describe("Demo seed data", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("seeds at least the quantities documented in the spec", () => {
    const db = getDemoData();

    expect(db.applicants.length).toBeGreaterThanOrEqual(20);
    expect(db.applications.length).toBeGreaterThanOrEqual(25);
    expect(db.appointments.length).toBeGreaterThanOrEqual(10);
    expect(db.centers.length).toBeGreaterThanOrEqual(4);
    expect(db.accounts.length).toBeGreaterThanOrEqual(8);
    expect(db.devices.length).toBeGreaterThanOrEqual(6);
    expect(db.notifications.length).toBeGreaterThanOrEqual(12);
    expect(db.auditEvents.length).toBeGreaterThanOrEqual(20);
    expect(db.analytics.length).toBeGreaterThanOrEqual(6);
  });

  it("covers every required application status at least once", () => {
    const db = getDemoData();
    const statuses = new Set<DemoApplicationStatus>(
      db.applications.map((a) => a.status)
    );
    (
      [
        "draft",
        "submitted",
        "pendingReview",
        "inProgress",
        "awaitingInfo",
        "exception",
        "approved",
        "rejected",
        "offlinePending",
        "rolledBack",
        "completed",
      ] as DemoApplicationStatus[]
    ).forEach((status) => {
      expect(statuses.has(status)).toBe(true);
    });
  });

  it("persists mutations across reads", () => {
    const db = getDemoData();
    db.notifications[0].read = true;
    setDemoData(db);

    const reread = getDemoData();
    expect(reread.notifications[0].read).toBe(true);
  });

  it("reset restores the original seeded state", () => {
    const db = getDemoData();
    const originalCount = db.applications.length;
    db.applications = [];
    setDemoData(db);
    expect(getDemoData().applications.length).toBe(0);

    resetDemoData();
    expect(getDemoData().applications.length).toBe(originalCount);
  });

  it("pins the documented public-tracking example reference", () => {
    const db = getDemoData();
    expect(
      db.applications.some((a) => a.reference === "APP-DEMO-2026-0001")
    ).toBe(true);
  });
});
