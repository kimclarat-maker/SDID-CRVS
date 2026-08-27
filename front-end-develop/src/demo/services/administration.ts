import { demoDelay } from "../config";
import { getDemoData, updateDemoData } from "../storage/demoStore";
import { DemoAccount, DemoCenter, DemoDevice, DemoRole } from "../types";

const paginate = <T>(items: T[], offset = 0, limit = 10) => ({
  data: items.slice(offset, offset + limit),
  total: items.length,
});

const toAccountRecord = (account: DemoAccount) => {
  const db = getDemoData();
  const center = db.centers.find((c) => c.id === account.centerId);
  return {
    _id: account.id,
    firstName: account.firstName,
    lastName: account.lastName,
    email: account.email,
    phoneNumber: account.phoneNumber,
    status: account.status,
    accessRole: { _id: account.role, name: account.role, value: account.role },
    center: center ? { _id: center.id, name: center.name } : undefined,
    createdAt: account.createdAt,
    idNumber: `DEMO-ACC-${account.id}`,
  };
};

export const demoFetchAccountByID = async (id: string) => {
  const db = getDemoData();
  const account = db.accounts.find((a) => a.id === id);
  return demoDelay({ data: account ? toAccountRecord(account) : undefined });
};

export const demoRemoveAccountCenter = async (id: string) => {
  let result: ReturnType<typeof toAccountRecord> | undefined;
  updateDemoData((db) => {
    const account = db.accounts.find((a) => a.id === id);
    if (!account) return db;
    account.centerId = "";
    logAdminAction(db, "updated", "accounts", account.email, `Center removed from ${account.email}.`);
    result = toAccountRecord(account);
    return db;
  });
  return demoDelay({ data: { message: "Center removed successfully.", ...result } });
};

export const demoDeleteAccount = async (id: string) => {
  updateDemoData((db) => {
    const account = db.accounts.find((a) => a.id === id);
    if (account) logAdminAction(db, "deleted", "accounts", account.email, `Account ${account.email} deleted.`);
    db.accounts = db.accounts.filter((a) => a.id !== id);
    return db;
  });
  return demoDelay({ data: { message: "Account deleted successfully." } });
};

export const demoDeleteCenter = async (id: string) => {
  updateDemoData((db) => {
    const center = db.centers.find((c) => c.id === id);
    if (center) logAdminAction(db, "deleted", "centers", center.name, `Center ${center.name} deleted.`);
    db.centers = db.centers.filter((c) => c.id !== id);
    return db;
  });
  return demoDelay({ data: { message: "Center deleted successfully." } });
};

export const demoDeleteDevice = async (id: string) => {
  updateDemoData((db) => {
    const device = db.devices.find((d) => d.id === id);
    if (device) logAdminAction(db, "deleted", "device", device.serialNumber, `Device ${device.serialNumber} deleted.`);
    db.devices = db.devices.filter((d) => d.id !== id);
    return db;
  });
  return demoDelay({ data: { message: "Device deleted successfully." } });
};

export const demoFetchAccounts = async (params: {
  offset?: number;
  limit?: number;
  status?: string;
  search?: string;
}) => {
  const db = getDemoData();
  let results = db.accounts;

  if (params.status) {
    results = results.filter((a) => a.status === params.status);
  }
  if (params.search) {
    const term = params.search.toLowerCase();
    results = results.filter(
      (a) =>
        a.firstName.toLowerCase().includes(term) ||
        a.lastName.toLowerCase().includes(term) ||
        a.email.toLowerCase().includes(term)
    );
  }

  const { data, total } = paginate(
    results,
    params.offset,
    params.limit || 10
  );

  return demoDelay({ data: { data: data.map(toAccountRecord), total } });
};

const toCenterRecord = (center: DemoCenter) => ({
  _id: center.id,
  name: center.name,
  region: center.region,
  district: center.district,
  address: center.address,
  phoneNumber: center.phoneNumber,
  status: center.status,
});

export const demoFetchCenters = async (params: {
  offset?: number;
  limit?: number;
}) => {
  const db = getDemoData();
  const { data, total } = paginate(db.centers, params.offset, params.limit || 10);
  return demoDelay({ data: data.map(toCenterRecord), total });
};

// src/constants/deviceTypes.ts is the real taxonomy the biometric-capture
// wizard keys off (getDeviceSerialNumber("FACE"/"IRIS"/"FINGERPRINT"/
// "SIGNATURE") in biometricCapture/index.tsx) — the seeded DemoDeviceType
// values are an unrelated lowercase naming used only for admin device-list
// display, so map between the two here rather than renaming the seed type.
const DEVICE_TYPE_TO_WIZARD_TYPE: Record<DemoDevice["type"], string> = {
  camera: "FACE",
  iris: "IRIS",
  fingerprint: "FINGERPRINT",
  signature_pad: "SIGNATURE",
  laptop: "LAPTOP",
};

const toDeviceRecord = (device: DemoDevice) => {
  const db = getDemoData();
  const center = db.centers.find((c) => c.id === device.centerId);
  return {
    _id: device.id,
    serialNumber: device.serialNumber,
    deviceType: DEVICE_TYPE_TO_WIZARD_TYPE[device.type] || device.type,
    item: device.type,
    status: device.status,
    center: center ? { _id: center.id, name: center.name } : undefined,
    assignedAt: device.assignedAt,
  };
};

export const demoFetchDevices = async (params: {
  offset?: number;
  limit?: number;
}) => {
  const db = getDemoData();
  const { data, total } = paginate(db.devices, params.offset, params.limit || 10);
  return demoDelay({ data: data.map(toDeviceRecord), total });
};

export const demoFetchNotifications = async () => {
  const db = getDemoData();
  return demoDelay({
    data: db.notifications.map((n) => ({
      _id: n.id,
      title: n.title,
      message: n.message,
      read: n.read,
      createdAt: n.createdAt,
    })),
    total: db.notifications.length,
  });
};

export const demoFetchAuditEvents = async (params: {
  offset?: number;
  limit?: number;
}) => {
  const db = getDemoData();
  const { data, total } = paginate(
    db.auditEvents,
    params.offset,
    params.limit || 20
  );
  return demoDelay({
    data: data.map((e) => ({
      _id: e.id,
      action: e.action,
      module: e.module,
      identifier: e.targetRef,
      createdAt: e.at,
      data: { modifiedBy: { firstName: e.actor.split(" ")[0], lastName: e.actor.split(" ")[1] } },
    })),
    total,
  });
};

const logAdminAction = (
  db: ReturnType<typeof getDemoData>,
  action: string,
  module: string,
  targetRef: string,
  details: string
) => {
  db.auditEvents.unshift({
    id: `LOG-${Date.now()}`,
    actor: "Demo Administrator",
    action,
    module,
    targetRef,
    at: new Date().toISOString(),
    details,
  });
};

const DEMO_ROLES: { _id: string; name: string; value: DemoRole | string }[] = [
  { _id: "role-administrator", name: "Administrator", value: "SUPERADMIN" },
  {
    _id: "role-enrolment_officer",
    name: "Enrolment Officer",
    value: "enrolment_officer",
  },
  { _id: "role-reviewer", name: "Reviewer", value: "reviewer" },
  { _id: "role-supervisor", name: "Supervisor", value: "supervisor" },
];

export const demoFetchRoles = async () =>
  demoDelay({ data: DEMO_ROLES, total: DEMO_ROLES.length });

// Workflow E: administrative management — create/update a demo account.
export const demoSaveAccount = async (body: {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: DemoRole;
  centerId?: string;
  status?: "active" | "inactive";
}) => {
  const db = updateDemoData((db) => {
    if (body._id) {
      const existing = db.accounts.find((a) => a.id === body._id);
      if (existing) {
        Object.assign(existing, {
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          phoneNumber: body.phoneNumber || existing.phoneNumber,
          role: body.role,
          centerId: body.centerId || existing.centerId,
          status: body.status || existing.status,
        });
        logAdminAction(
          db,
          "updated",
          "accounts",
          existing.email,
          `Account ${existing.email} updated.`
        );
      }
    } else {
      const account: DemoAccount = {
        id: `ACC-${Date.now()}`,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phoneNumber: body.phoneNumber || "+000 555 0100",
        role: body.role,
        centerId: body.centerId || db.centers[0]?.id,
        status: body.status || "active",
        createdAt: new Date().toISOString(),
      };
      db.accounts.push(account);
      logAdminAction(
        db,
        "created",
        "accounts",
        account.email,
        `Account ${account.email} created with role ${account.role}.`
      );
    }
    return db;
  });

  return demoDelay({ message: "Account saved (demo)." , data: db});
};

// Workflow E: assign a demo device to a centre.
export const demoAssignDeviceToCenter = async (
  deviceId: string,
  centerId: string
) =>
  demoDelay(
    updateDemoData((db) => {
      const device = db.devices.find((d) => d.id === deviceId);
      if (!device) return db;

      device.centerId = centerId;
      device.assignedAt = new Date().toISOString();
      const center = db.centers.find((c) => c.id === centerId);

      logAdminAction(
        db,
        "assigned",
        "devices",
        device.serialNumber,
        `Device ${device.serialNumber} assigned to ${center?.name || "a centre"}.`
      );

      return db;
    })
  );

export const demoSaveDevice = async (body: {
  _id?: string;
  serialNumber: string;
  type: DemoDevice["type"];
  centerId?: string;
  status?: DemoDevice["status"];
}) => {
  if (body._id) {
    if (body.centerId) await demoAssignDeviceToCenter(body._id, body.centerId);
    return demoDelay({ message: "Device updated (demo)." });
  }

  updateDemoData((db) => {
    const device: DemoDevice = {
      id: `DEV-${Date.now()}`,
      serialNumber: body.serialNumber,
      type: body.type,
      centerId: body.centerId || db.centers[0]?.id,
      status: body.status || "active",
      assignedAt: new Date().toISOString(),
    };
    db.devices.push(device);
    logAdminAction(
      db,
      "created",
      "devices",
      device.serialNumber,
      `Device ${device.serialNumber} registered (demo).`
    );
    return db;
  });

  return demoDelay({ message: "Device registered (demo)." });
};
