import toastMessage from "@/utils/common/toastMessage";
import { GETParameters, SMSTemplateGETParameters } from "@/types/SMS";
import api from "..";

export const fetchSMSSettings = async (params?: GETParameters) => {
  try {
    if (params && params?.offset && params?.offset > 0) {
      params.offset -= 1;
    }

    const options = {
      method: "GET",
      url: `/configuration/sms-settings`,
      params,
    };

    const { data } = await api(options);

    return {
      data: data.data || data,
      total: data.total,
    };
  } catch (error) {
    toastMessage("error", error);
  }
};

export const fetchSMSTemplates = async (params?: SMSTemplateGETParameters) => {
  try {
    const options = {
      method: "GET",
      url: `/configuration/sms-templates`,
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

export const sendSMS = async (params?: {
  phoneNumber: string;
  textMessage: string;
}) => {
  try {
    const options = {
      method: "POST",
      url: `/sms`,
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

export const fetchSMSFlows = async () => {
  try {
    const options = {
      method: "GET",
      url: `/configuration/sms-templates/flows`,
      params: {
        offset: 0,
        limit: 100,
      },
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
