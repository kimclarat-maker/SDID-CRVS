import { CenterType } from "./Center";
import { RoleType } from "./ROLE";

export type AccountType = {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  password?: string;
  center?: any;
  accessRole?: any;
  documentType?: any;
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
