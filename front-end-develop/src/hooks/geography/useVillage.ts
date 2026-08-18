import { fetchVillages, fetchVillagesByCell } from "@/api/geography/village";
import { VillageGETParameters, VillageTypes } from "@/types/geography";
import formatSelectData from "@/utils/common/formatSelectData";
import { useState } from "react";

export const useFetchVillages = (type?: string, valueName = "_id") => {
  const [loadingVillages, setLoading] = useState(false);
  const [villages = [], setData] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchVillagesData = async (params?: VillageGETParameters) => {
    setLoading(true);

    try {
      const data = await fetchVillages(params);

      if (data && data.data) {
        if (type === "dropdown") {
          const formatData = formatSelectData(
            data.data.data,
            "name",
            valueName
          );

          setData(formatData);
          setLoading(false);

          return;
        }

        setData(data.data.data.slice(0, 10));

        setTotalPages(data.data.total);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch villages:", error);

      setLoading(false);
    }
  };

  return {
    villages,
    loadingVillages,
    fetchVillagesData,
    setLoading,
    totalPages,
  };
};

export const useFetchVillagesByCell = (type?: string) => {
  const [loadingVillages, setLoading] = useState(false);
  const [villages = [], setData] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchVillagesByCellData = async (cellId: string, status?: string) => {
    setLoading(true);

    try {
      const data = await fetchVillagesByCell(cellId, status);

      if (data && data.data) {
        if (type === "dropdown") {
          const formatData = formatSelectData(data.data, "name", "_id");

          setData(formatData);
          setLoading(false);

          return;
        }

        setData(data.data);

        setTotalPages(data.total);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch villages:", error);

      setLoading(false);
    }
  };

  return {
    villages,
    loadingVillages,
    fetchVillagesByCellData,
    setLoading,
    totalPages,
  };
};
