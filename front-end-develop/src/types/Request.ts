export type RequestType = {
  _id: string;
  firstName: string;
  lastName: string;
  idNumber: string;
  center: string;
  contact: string;
  date: string;
  status?: string;
  requestNo: string;
  preHistoricalInfo: any;
  rejectComment?: string;
  reviewer?: {
    _id?: string;
    id?: string;
    firstName?: string;
    lastName: string;
    center: string;
    photo?: any;
  };
  phoneNumber?: string;
  parent: any;
  motherNames?: string;
  fatherNames?: string;
};

export type GETParameters = {
  id?: string;
  offset?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  province?: string;
  center?: string;
  search?: string;
  requestNo?: string;
  country?: string;
  order?: string;
};

export type GETSelfieParameters = {
  id?: string;
  offset?: number;
  limit?: number;
  selfieVerificationSkipStatus: string;
  identifier?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  order?: string;
};
