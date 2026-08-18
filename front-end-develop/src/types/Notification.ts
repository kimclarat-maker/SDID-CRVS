export type NotificationType = {
  _id?: string;
  subject: string;
  message: string;
  status: string;
  date: string;
};

export type GETParameters = {
  offset: number;
  limit: number;
  center?: string[];
  startDate?: string;
  endDate?: string;
  search?: string;
};

export type GETSingleNotification = {
  _id?: string;
  status: string;
  url: string;
  message: string;
  subject: string;
};
