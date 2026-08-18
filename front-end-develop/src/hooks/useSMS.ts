import { fetchSMSFlows, fetchSMSSettings, fetchSMSTemplates } from "@/api/sms";
import formatSelectData from "@/utils/common/formatSelectData";
import { useState } from "react";

export const useFetchSMSSettings = () => {
  const [loadingSmsSettings, setLoading] = useState(false);
  const [smsSettingsData, setData] = useState([]);

  const fetchSMSSettingsData = async () => {
    setLoading(true);

    try {
      const data = await fetchSMSSettings();

      if (data && data.data) {
        setData(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch sms settings:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    smsSettingsData,
    loadingSmsSettings,
    fetchSMSSettingsData,
    setLoading,
  } as const;
};

export const useFetchSMSTemplate = () => {
  const [loadingSmsSettings, setLoading] = useState(false);
  const [smsTemplateData, setData] = useState([]);

  const fetchSMSTemplateData = async () => {
    setLoading(true);

    try {
      const data = await fetchSMSTemplates();

      if (data && data?.data?.data) {
        setData(data.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch sms template:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchSMSTemplateData,
    loadingSmsSettings,
    smsTemplateData,
  } as const;
};

export const useFetchSMSFlows = (type?: string) => {
  const [loadingFlows, setLoading] = useState(false);
  const [flows, setData] = useState([]);

  const fetchSMSFlowsData = async () => {
    setLoading(true);

    try {
      const data = await fetchSMSFlows();

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
    fetchSMSFlowsData,
    setLoading,
  };
};
