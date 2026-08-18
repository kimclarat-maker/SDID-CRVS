export type DeviceType = {
  serialNumber: any;
  name: string;
  item: string;
  model: string;
  deviceType: any;
  status: string | { label: string; value: string } | null;
  [key: string]: any;
};

export type GETParameters = {
  offset?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
  accountId?: string;
  deviceType?: any;
  assignmentStatus?: string;
  serialNumber?: string;
};
