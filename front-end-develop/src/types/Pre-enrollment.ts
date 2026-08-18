export type PreEnrollment = {
  _id?: string;
  firstName: string;
  lastName: string;
  preEnrollmentId: string;
  contact: string;
  scheduledDate: string;
  date: string;
  [key: string]: any;
};

export type GETParameters = {
  offset: number;
  limit: number;
  province?: string[];
  center?: string[];
  startDate?: string;
  endDate?: string;
  search?: string;
  requestNo?: string;
};
