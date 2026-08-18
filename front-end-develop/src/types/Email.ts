export type EmailTypes = {
  email: string;
};

export type GETParameters = {
  email?: string;
  offset: number;
  limit: number;
};

export type EmailTemplateTypes = {
  _id?: string;
  effectiveDate: string;
  flowId: any;
  sno?: string;
  emailMultiLangSub?: any;
  emailMultiLangText?: any;
  emailSubENG: string;
  emailSubFR: string;
  emailSubRW: string;
  emailTextENG: string;
  emailTextFR: string;
  emailTextRW: string;
};

export type EmailTemplateGETParameters = {
  offset: number;
  limit: number;
};
