export type RoleType = {
  name: string;
  search?: string;
  description?: string;
  [key: string]: any;
};
export type MenuType = {
  name: string;
  accessRoles?: RoleType[];
  description?: string;
  [key: string]: any;
};
export type GETParameters = {
  name?: string;
  offset?: number;
  limit?: number;
  search?: string;
  id?: string;
};

export type GETMenusParameters = {
  name?: string;
  offset: number;
  limit: number;
  search?: string;
  accessRole?: string;
};
