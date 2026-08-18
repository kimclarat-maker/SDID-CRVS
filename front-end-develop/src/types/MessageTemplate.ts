export type MessageTemplateTypes = {
  instanceName: string;
  instanceType: string;
  message: string;
};

export type GETParameters = {
  instanceName?: string;
  instanceType?: string;
  offset: number;
  limit: number;
  search?: string;
};
