// Demo-mode backing for src/api/email and src/api/sms — the configuration
// screens for notification templates/settings, plus the send actions those
// screens (and other flows, e.g. OTP) trigger. No real email/SMS gateway
// exists in demo mode, so sends are simulated (always succeed, logged to the
// console) and settings/templates/flows are returned as a small static set —
// there's no create/edit UI for these, only read + send.
import { demoDelay } from "../config";

let DEMO_EMAIL_SETTINGS = [
  { _id: "email-setting-1", provider: "SMTP (demo)", fromAddress: "noreply@demo.identity.local", status: "active" },
];

let DEMO_EMAIL_TEMPLATES = [
  { _id: "email-tpl-otp", name: "OTP Verification", subject: "Your verification code", flowId: "otp" },
  { _id: "email-tpl-approved", name: "Application Approved", subject: "Your application has been approved", flowId: "approval" },
  { _id: "email-tpl-rejected", name: "Application Rejected", subject: "Update on your application", flowId: "rejection" },
];

export const demoDeleteEmailSetting = async (id: string) => {
  DEMO_EMAIL_SETTINGS = DEMO_EMAIL_SETTINGS.filter((s) => s._id !== id);
  return demoDelay({ data: { message: "Email setting deleted (demo)." } });
};

export const demoDeleteEmailTemplate = async (id: string) => {
  DEMO_EMAIL_TEMPLATES = DEMO_EMAIL_TEMPLATES.filter((t) => t._id !== id);
  return demoDelay({ data: { message: "Email template deleted (demo)." } });
};

const DEMO_FLOWS = [
  { flowId: "otp", description: "One-time password delivery" },
  { flowId: "approval", description: "Application approved notification" },
  { flowId: "rejection", description: "Application rejected notification" },
  { flowId: "appointment", description: "Appointment reminder" },
];

export const demoFetchEmailSettings = async () =>
  demoDelay({
    data: { data: DEMO_EMAIL_SETTINGS, total: DEMO_EMAIL_SETTINGS.length },
    total: DEMO_EMAIL_SETTINGS.length,
  });

export const demoFetchEmailTemplate = async () =>
  demoDelay({
    data: { data: DEMO_EMAIL_TEMPLATES, total: DEMO_EMAIL_TEMPLATES.length },
    total: DEMO_EMAIL_TEMPLATES.length,
  });

export const demoFetchEmailFlows = async () =>
  demoDelay({
    data: { data: DEMO_FLOWS, total: DEMO_FLOWS.length },
    total: DEMO_FLOWS.length,
  });

export const demoSendEmail = async () =>
  demoDelay({ data: { message: "Email sent (demo)." } });

export const demoSendEmailMessage = async () =>
  demoDelay({ data: { message: "Email sent (demo)." } });

let DEMO_SMS_SETTINGS = [
  { _id: "sms-setting-1", provider: "Demo SMS Gateway", senderId: "SDID-DEMO", status: "active" },
];

let DEMO_SMS_TEMPLATES = [
  { _id: "sms-tpl-otp", name: "OTP Verification", flowId: "otp" },
  { _id: "sms-tpl-appointment", name: "Appointment Reminder", flowId: "appointment" },
];

export const demoDeleteSMSSetting = async (id: string) => {
  DEMO_SMS_SETTINGS = DEMO_SMS_SETTINGS.filter((s) => s._id !== id);
  return demoDelay({ data: { message: "SMS setting deleted (demo)." } });
};

export const demoDeleteSMSTemplate = async (id: string) => {
  DEMO_SMS_TEMPLATES = DEMO_SMS_TEMPLATES.filter((t) => t._id !== id);
  return demoDelay({ data: { message: "SMS template deleted (demo)." } });
};

export const demoFetchSMSSettings = async () =>
  demoDelay({ data: DEMO_SMS_SETTINGS, total: DEMO_SMS_SETTINGS.length });

export const demoFetchSMSTemplates = async () =>
  demoDelay({
    data: { data: DEMO_SMS_TEMPLATES, total: DEMO_SMS_TEMPLATES.length },
    total: DEMO_SMS_TEMPLATES.length,
  });

export const demoFetchSMSFlows = async () =>
  demoDelay({
    data: { data: DEMO_FLOWS, total: DEMO_FLOWS.length },
    total: DEMO_FLOWS.length,
  });

export const demoSendSMS = async (params?: { phoneNumber: string; textMessage: string }) => {
  console.log(`[demo mode] SMS to ${params?.phoneNumber}: ${params?.textMessage}`);
  return demoDelay({ data: { message: "SMS sent (demo)." } });
};
