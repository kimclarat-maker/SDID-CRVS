export type HolidayType = {
  _id?: string;
  name: string;
  holidayDate: string;
  postedBy?: string;
};

export type GETParameters = {
  offset: number;
  limit: number;
  id?: string;
  name?: string | undefined;
  search?: string;
};
