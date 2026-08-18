export type MessageType = {
  _id?: string;
  instanceName: string;
  instanceType?: string;
  message: string;
  subject?: string;
  channel?: string;
};

export type SMSType = {
  sno?: string;
  email: string;
  apiKey: string;
  serviceId: string;
  mobileServiceId: string;
  effectiveDate: string;
  username: string;
  modifiedBy?: string;
  status: string;
  smsProvider: any;
  scope: string;
  _id?: string;
  baseUrl?: string;
};

export type EmailType = {
  username: string;
  fromAddress: string;
  smtpAddress: string;
  sslEnable?: boolean | undefined | number;
  smtpPort: string;
  smtpPassword: string;
  effectiveDate: string;
  postedBy?: string;
  modifiedBy?: string;
  status: string;
  [key: string]: any;
};
