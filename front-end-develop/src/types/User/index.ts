import { AccountType } from "../Account";

export type UserType = {
  _id?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  token?: string;
  photo?: string;
  accountType?: string;
  phoneNumber?: string;
  account?: AccountType;
  showLogs?: boolean;
  documentType?: any;
  accessRole?: any;
  center?: any;
  idNumber?: string;
  tempToken?: string;
};

export type RevalidateAccountType = {
  password: string;
};

export type LoginType = {
  email: string;
  password: string;
};
