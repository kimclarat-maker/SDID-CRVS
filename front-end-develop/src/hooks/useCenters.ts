import { fetchCenterById, fetchCenters } from "@/api/centers";
import { CenterType, GETParameters } from "@/types/Center";
import formatSelectData from "@/utils/common/formatSelectData";
import { useState } from "react";

export const useFetchCenters = (type?: string) => {
  const [loadingCenters, setLoading] = useState(false);
  const [centers = [], setCenters] = useState<CenterType[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchCentersData = async (params: GETParameters) => {
    setLoading(true);
    try {
      const data = await fetchCenters(params);

      if (data && data.data) {
        if (type === "dropdown") {
          const formatData = formatSelectData(data.data, "name", "_id");

          setCenters(formatData);
          setLoading(false);

          return formatData;
        }
        setCenters(data.data);
        setTotalPages(data.total);
        setLoading(false);

        return;
      }
    } catch (error) {
      console.error("Failed to fetch centers:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    centers,
    loadingCenters,
    fetchCentersData,
    setLoading,
    totalPages,
    setCenters,
  };
};

export const useFetchSingleCenter = (type?: string) => {
  const [loadingCenter, setLoading] = useState(false);
  const [center = {}, setCenter] = useState<any>({});

  const fetchCenterData = async (id: string) => {
    setLoading(true);
    try {
      const data = await fetchCenterById(id);

      if (data) {
        if (type === "dropdown") {
          const formatData = formatSelectData([data], "name", "_id");

          setCenter(formatData);
          setLoading(false);

          return;
        }
        setCenter(data);
        setLoading(false);
      }
    } catch (error) {
      console.error("Failed to fetch single center:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    center,
    loadingCenter,
    fetchCenterData,
    setLoading,
  };
};
