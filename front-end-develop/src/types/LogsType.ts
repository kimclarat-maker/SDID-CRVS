export type LogType = {
  _id?: string;
};

export type GETParameters = {
  fromDay: string;
  toDay: string;
  offset: number;
  limit: number;
};

export type GETModuleLogsParameters = {
  offset: number;
  limit: number;
  fromDay: string;
  toDay: string;
  search: string;
};

export type GETAccountIdentityLogsParameters = {
  offset: number;
  limit: number;
  fromDay: string;
  toDay: string;
  identityNumber: string;
  "data.method"?: string;
  // module: string;
  accountAction?: string;
};

export type GETByRequestIdentifierLogsParameters = {
  offset: number;
  limit: number;
  fromDay: string;
  toDay: string;
  identifier: string;
};
