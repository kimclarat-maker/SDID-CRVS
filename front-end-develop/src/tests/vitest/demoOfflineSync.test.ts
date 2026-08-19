import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDemoData } from "@/demo/storage/demoStore";
import { demoSyncOfflineApplication } from "@/demo/services/applications";

describe("Offline synchronization simulation (Workflow D)", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("marks the application synced on simulated success and logs it", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // forces the "synced" branch
    const offline = getDemoData().applications.find(
      (a) => a.status === "offlinePending"
    )!;

    const outcome = await demoSyncOfflineApplication(offline.id, "Test Officer");

    expect(outcome).toBe("synced");
    const updated = getDemoData().applications.find((a) => a.id === offline.id);
    expect(updated?.syncedToCentral).toBe(true);
    expect(getDemoData().auditEvents[0].action).toBe("synchronised");
  });

  it("supports retrying after a simulated failure", async () => {
    const offline = getDemoData().applications.find(
      (a) => a.status === "offlinePending"
    )!;

    vi.spyOn(Math, "random").mockReturnValue(0.99); // forces "failed"
    const failed = await demoSyncOfflineApplication(offline.id, "Test Officer");
    expect(failed).toBe("failed");
    expect(
      getDemoData().applications.find((a) => a.id === offline.id)
        ?.syncedToCentral
    ).not.toBe(true);

    vi.spyOn(Math, "random").mockReturnValue(0); // retry succeeds
    const retried = await demoSyncOfflineApplication(offline.id, "Test Officer");
    expect(retried).toBe("synced");
  });
});
