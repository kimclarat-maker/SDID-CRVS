export type ModuleType = {
  name: string;
  search?: string;
  [key: string]: any;
};
export type GETParameters = {
  name?: string;
  offset: number;
  limit?: number;
  search?: string;
  id?: string;
};
