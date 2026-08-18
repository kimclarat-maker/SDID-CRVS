export type PermissionType = {
  module: string;
  get: string;
  post: string;
  update: string;
  delete: string;
  [key: string]: any;
};

export type AccessRightType = {
  roleId: string;
  permissions: PermissionType[];
};

export type GETParameters = {
  id?: string;
  offset?: number;
  limit?: number;
  search?: string;
  module?: string;
  roleId?: string;
  order?: string;
};
