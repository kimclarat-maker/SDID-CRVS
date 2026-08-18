import toastMessage from "@/utils/common/toastMessage";
import { GETParameters } from "@/types/SMS";
import api from "..";

export const fetchEmailSettings = async (params?: GETParameters) => {
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
