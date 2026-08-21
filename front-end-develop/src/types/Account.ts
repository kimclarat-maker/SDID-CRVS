import { CenterType } from "./Center";
import { RoleType } from "./ROLE";
import { StaffAssignment } from "./Workspace";

export type AccountType = {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  password?: string;
  center?: any;
  accessRole?: any;
  documentType?: any;
  // Optional so existing backend responses (which don't send it yet) keep
  // working unmodified — accounts without this are treated as legacy SDID
  // staff by the compatibility adapter in src/utils/workspace/index.ts.
  assignments?: StaffAssignment[];
  [key: string]: any;
};

export type GETParameters = {
  offset?: number;
  limit?: number;
  province?: string[];
  center?: string[];
  search?: string;
  country?: string;
  idNumber?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  status?: string;
};
