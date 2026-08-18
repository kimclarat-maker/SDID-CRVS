export type ReportType = {
  _id: number;
  center: string;
  completed: number;
  rollBacks: number;
  scheduled: number;
};

export type GETParameters = {
  offset: number;
  limit: number;
  startDate?: string;
  endDate?: string;
  search?: string;
  center?: string;
  [key: string]: any;
};
