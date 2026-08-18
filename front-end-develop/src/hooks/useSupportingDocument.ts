import {
  fetchSingleSupportingDocuments,
  fetchSupportingDocuments,
} from "@/api/supporting-documents";
import {
  GETParameters,
  SupportingDocumentTypes,
} from "@/types/SupportingDocument";
import formatSelectData from "@/utils/common/formatSelectData";
import { useState } from "react";

export const useFetchSupportingDocuments = (type?: string) => {
  const [loading, setLoading] = useState(false);
  const [data = [], setData] = useState<SupportingDocumentTypes[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchSupportingDocumentsData = async (params?: GETParameters) => {
    setLoading(true);

    try {
      const data = await fetchSupportingDocuments(params);

      if (data && data.data) {
        if (type === "dropdown") {
          const formatData = formatSelectData(data.data, "fieldName", "_id");
          setData(formatData);
          setLoading(false);

          return;
        }

        setData(data.data);

        setTotalPages(data?.data?.total);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch supporting documents:", error);

      setLoading(false);
    }
  };

  return {
    data,
    loading,
    fetchSupportingDocumentsData,
    setLoading,
    totalPages,
  };
};

export const useFetchSupportingDocumentsByField = (type?: string) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>({});

  const fetchSupportingDocumentsByFieldData = async (fieldName: string) => {
    setLoading(true);

    try {
      const data = await fetchSingleSupportingDocuments(fieldName);

      setData((prevData: any) => ({
        ...prevData,
        [fieldName]: data || [],
      }));

      setLoading(false);

      return data;
    } catch (error) {
      console.error("Failed to fetch field supporting documents:", error);

      setLoading(false);
    }
  };

  return {
    data,
    loading,
    fetchSupportingDocumentsByFieldData,
  };
};
