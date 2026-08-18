import {
  fetchDevices,
  fetchDeviceByID,
  assignmentDeviceHistorical,
  auditLogsDevice,
  deviceReport,
  getConnectedIris,
  getConnectedFingerprint,
  getConnectedSignatures,
  getConnectedWebcams,
} from "@/api/device";
import { DeviceType, GETParameters } from "@/types/Device";
import formatSelectData from "@/utils/common/formatSelectData";
import toastMessage from "@/utils/common/toastMessage";
import { useState } from "react";

export const useFetchDevices = (type?: string) => {
  const [loading, setLoading] = useState(false);
  const [data = [], setData] = useState<DeviceType[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchDeviceData = async (params: GETParameters) => {
    setLoading(true);

    try {
      const data = await fetchDevices(params);

      if (data && data.data) {
        if (type === "dropdown") {
          const formatData = data.data.data.map((el: DeviceType) => {
            return {
              ...el,
              label: el.serialNumber,
              value: el._id,
            };
          });

          setData(formatData);
          setLoading(false);

          return;
        }

        setData(data.data);

        setTotalPages(data.total);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch device:", error);

      setLoading(false);
    }
  };

  return { data, loading, fetchDeviceData, setLoading, totalPages };
};

export const useFetchDeviceById = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>();

  const fetchDeviceData = async (id: string) => {
    setLoading(true);

    try {
      const data = await fetchDeviceByID(id);
      setData(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch account history log:", error);

      setLoading(false);
    }
  };

  return { data, loading, fetchDeviceData, setLoading };
};

export const useFetchDeviceAssignmentHistory = () => {
  const [loading, setLoading] = useState(false);
  const [data = [], setData] = useState<any>([]);

  const fetchDeviceData = async (id: string) => {
    setLoading(true);

    try {
      const data = await assignmentDeviceHistorical(id);

      setData(data.data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  return { data, loading, fetchDeviceData, setLoading };
};

export const useFetchDeviceAuditLogs = () => {
  const [loading, setLoading] = useState(false);
  const [data = [], setData] = useState<any>([]);

  const fetchDeviceData = async (id: string) => {
    setLoading(true);

    try {
      const data = await auditLogsDevice(id);

      setData(data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  return { data, loading, fetchDeviceData, setLoading };
};

export const useFetchDeviceReport = () => {
  const [loading, setLoading] = useState(false);
  const [data = [], setData] = useState<any>([]);

  const fetchDeviceData = async (params: any) => {
    setLoading(true);

    try {
      const data = await deviceReport(params);

      setData(data.data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  return { data, loading, fetchDeviceData, setLoading };
};

export const useFetchIris = () => {
  const [loading, setLoading] = useState(false);
  const [data = [], setData] = useState<any>([]);

  const fetchConnectedData = async () => {
    setLoading(true);

    try {
      const list = await getConnectedIris();

      const formateData = list?.map((el: any) => {
        return {
          ...el,
          label: el.serial,
          value: el.serial,
        };
      });
      setData(formateData);
      setLoading(false);

      return formateData;
    } catch (error) {
      setLoading(false);

      toastMessage("error", error);
    }
  };

  return { data, loading, fetchConnectedData, setLoading };
};

export const useFetchFingerprint = () => {
  const [loading, setLoading] = useState(false);
  const [data = [], setData] = useState<any>([]);

  const fetchConnectedData = async () => {
    setLoading(true);

    try {
      const list = await getConnectedFingerprint();

      const formateData = list?.map((el: any) => {
        return {
          ...el,
          label: el.serial,
          value: el.serial,
        };
      });
      setData(formateData);
      setLoading(false);
      return formateData;
    } catch (error) {
      setLoading(false);

      toastMessage("error", error);
    }
  };

  return { data, loading, fetchConnectedData, setLoading };
};

export const useFetchWebcams = () => {
  const [loading, setLoading] = useState(false);
  const [data = [], setData] = useState<any>([]);

  const fetchConnectedData = async () => {
    setLoading(true);

    try {
      const list = await getConnectedWebcams();

      const formateData = list
        ?.map((el: any) => {
          return {
            ...el,
            label: el.serial,
            value: el.serial,
          };
        })
        .filter((el: any) => el.class?.toUpperCase() === "USB");

      setData(formateData);
      setLoading(false);
      return formateData;
    } catch (error) {
      setLoading(false);

      toastMessage("error", error);
    }
  };

  return { data, loading, fetchConnectedData, setLoading };
};

export const useFetchSignatures = () => {
  const [loading, setLoading] = useState(false);
  const [data = [], setData] = useState<any>([]);

  const fetchConnectedData = async () => {
    setLoading(true);

    try {
      const list = await getConnectedSignatures();

      const formateData = list?.map((el: any) => {
        return {
          ...el,
          label: `${el.name} ${el.serial}`,
          value: el.serial,
        };
      });
      setData(formateData);
      setLoading(false);

      return formateData;
    } catch (error) {
      setLoading(false);

      toastMessage("error", error);
    }
  };

  return { data, loading, fetchConnectedData, setLoading };
};

export const useFetchConnectedDevices = () => {
  const [loading, setLoading] = useState(false);
  const [data = [], setData] = useState<any>([]);

  const fetchDeviceConnectedData = async () => {
    setLoading(true);

    try {
      const [irisData, fingerprintData, signaturesData, webcamsData] =
        await Promise.all([
          getConnectedIris(),
          getConnectedFingerprint(),
          getConnectedSignatures(),
          getConnectedWebcams(),
        ]);

      setData({
        iris: irisData,
        fingerprint: fingerprintData,
        signature: signaturesData,
        webcams: webcamsData
          ?.map((el: any) => {
            return {
              ...el,
              label: `${el.name} ${el.serial}`,
              value: `ACN6${el.serial}`,
            };
          })
          .filter((el: any) => el.class?.toUpperCase() === "USB"),
      });
      setLoading(false);
    } catch (error) {
      setLoading(false);

      toastMessage("error", error);
    }
  };

  return { data, loading, fetchDeviceConnectedData, setLoading };
};
