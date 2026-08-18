export type GeneralConfiguration = {
  _id?: string;
  type: string;
  duration?: string;
};

export type GETParameters = {
  offset: number;
  limit: number;
  id?: string;
  status?: string | undefined;
  search?: string;
};
