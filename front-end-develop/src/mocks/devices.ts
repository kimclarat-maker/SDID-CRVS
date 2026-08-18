import { DeviceType } from "@/types/Device";

export const biometricDevices: DeviceType[] = [
  {
    serialNumber: "1234567890",
    name: "Biometric Device 1",
    operator: "Operator A",
    _id: "1",
    model: "Model A",
    status: "Active",
    type: "iris",
  },
  {
    serialNumber: "1234567891",
    name: "Biometric Device 2",
    operator: "Operator B",
    _id: "2",
    model: "Model B",
    status: "Inactive",
    type: "fingerprint",
  },
  {
    serialNumber: "1234567892",
    name: "Biometric Device 3",
    operator: "Operator C",
    _id: "3",
    model: "Model C",
    status: "Active",
    type: "signature",
  },
  {
    serialNumber: "1234567893",
    name: "Biometric Device 4",
    operator: "Operator D",
    _id: "4",
    model: "Model D",
    status: "Inactive",
    type: "Biometric",
  },
  {
    serialNumber: "1234567894",
    name: "Biometric Device 5",
    operator: "Operator E",
    _id: "5",
    model: "Model E",
    status: "Active",
    type: "Biometric",
  },
];
