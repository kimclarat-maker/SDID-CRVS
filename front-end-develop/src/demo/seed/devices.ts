import { DemoCenter, DemoDevice, DemoDeviceType } from "../types";
import { isoDaysAgo, nextId } from "./fixtures";

const DEVICE_TYPES: DemoDeviceType[] = [
  "laptop",
  "fingerprint",
  "iris",
  "camera",
  "signature_pad",
  "laptop",
];

export const seedDevices = (centers: DemoCenter[]): DemoDevice[] =>
  DEVICE_TYPES.map((type, i) => ({
    id: nextId("DEV"),
    serialNumber: `DEMO/${type.toUpperCase()}/${(i + 1)
      .toString()
      .padStart(4, "0")}`,
    type,
    centerId: centers[i % centers.length].id,
    status: i === DEVICE_TYPES.length - 1 ? "maintenance" : "active",
    assignedAt: isoDaysAgo(180 - i * 10),
  }));
