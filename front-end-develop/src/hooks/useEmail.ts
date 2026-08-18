import {
  fetchEmailFlows,
  fetchEmailSettings,
  fetchEmailTemplate,
} from "@/api/email";
import { GETParameters } from "@/types/MessageTemplate";
import formatSelectData from "@/utils/common/formatSelectData";
import { useState } from "react";

export const useFetchEmailTemplate = () => {
  const [loadingEmailTemplate, setLoading] = useState(false);
  const [emailTemplateData, setData] = useState([]);

  const fetchEmailTemplateData = async (params?: GETParameters) => {
    setLoading(true);

    try {
      const data = await fetchEmailTemplate(params);

      if (data && data.data) {
        setData(data.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch email template:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    emailTemplateData,
    loadingEmailTemplate,
    fetchEmailTemplateData,
    setLoading,
  };
};

export const useFetchEmailSettings = () => {
  const [loadingEmailSettings, setLoading] = useState(false);
  const [emailSettingsData, setData] = useState([]);

  const fetchEmailSettingsData = async (params?: GETParameters) => {
    setLoading(true);

    try {
      const data = await fetchEmailSettings(params);

      if (data && data.data) {
        setData(data.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch email settings:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    emailSettingsData,
    loadingEmailSettings,
    fetchEmailSettingsData,
    setLoading,
  };
};

export const useFetchEmailFlows = (type?: string) => {
  const [loadingFlows, setLoading] = useState(false);
  const [flows, setData] = useState([]);

  const fetchEmailFlowsData = async () => {
    setLoading(true);

    try {
      const data = await fetchEmailFlows();

      if (data && data.data) {
        if (type === "dropdown") {
          const formatData = formatSelectData(
            data.data.data,
            "description",
            "flowId"
          );

          return setData(formatData);
        }
        setData(data.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch email template flows:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    flows,
    loadingFlows,
    fetchEmailFlowsData,
    setLoading,
  };
};
