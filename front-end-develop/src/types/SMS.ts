export type SMSTypes = {
  email: string;
  serviceId: string;
  mobileServiceId: string;
  apiKey: string;
};

export type GETParameters = {
  email?: string;
  offset: number;
  limit: number;
};

export type SMSTemplateTypes = {
  _id?: string;
  flowId: any;
  smsSub: string;
  smsTextENG: string;
  smsTextFR: string;
  smsTextRW: string;
  effectiveDate: string;
  smsMultiLangText?: any;
};

export type SMSTemplateGETParameters = {
  offset: number;
  limit: number;
};
