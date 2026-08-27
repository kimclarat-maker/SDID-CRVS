import toastMessage from "@/utils/common/toastMessage";
import { GETParameters } from "@/types/SMS";
import api from "..";
import { isDemoMode } from "@/demo/config";
import {
  demoFetchEmailSettings,
  demoFetchEmailTemplate,
  demoSendEmail,
  demoSendEmailMessage,
  demoFetchEmailFlows,
} from "@/demo/services/messaging";

export const fetchEmailSettings = async (params?: GETParameters) => {
  if (isDemoMode()) return demoFetchEmailSettings();
  try {
    const options = {
      method: "GET",
      url: `/configuration/email-settings`,
      params,
    };

    const { data } = await api(options);

    return {
      data,
      total: data.total,
    };
  } catch (error) {
    toastMessage("error", error);
  }
};

export const fetchEmailTemplate = async (params?: GETParameters) => {
  if (isDemoMode()) return demoFetchEmailTemplate();
  try {
    const options = {
      method: "GET",
      url: `/configuration/email-templates`,
      params,
    };

    const { data } = await api(options);

    return {
      data,
      total: data.total,
    };
  } catch (error) {
    toastMessage("error", error);
  }
};

export const sendEmail = async (params?: {}) => {
  if (isDemoMode()) return demoSendEmail();
  try {
    const options = {
      method: "POST",
      url: `/otp/email`,
      data: params,
    };

    const { data } = await api(options);

    return {
      data,
    };
  } catch (error) {
    toastMessage("error", error);
  }
};

export const sendEmailMessage = async (params?: {}) => {
  if (isDemoMode()) return demoSendEmailMessage();
  try {
    const options = {
      method: "POST",
      url: `/mail`,
      data: params,
    };

    const { data } = await api(options);

    return {
      data,
    };
  } catch (error) {
    toastMessage("error", error);
  }
};

export const fetchEmailFlows = async () => {
  if (isDemoMode()) return demoFetchEmailFlows();
  try {
    const options = {
      method: "GET",
      url: `/configuration/email-templates/flows`,
    };

    const { data } = await api(options);

    return {
      data,
      total: data.total,
    };
  } catch (error) {
    toastMessage("error", error);
  }
};
