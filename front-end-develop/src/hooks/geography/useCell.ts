import { fetchCells, fetchCellsBySector } from "@/api/geography/cell";
import { CellGETParameters, CellTypes } from "@/types/geography";
import formatSelectData from "@/utils/common/formatSelectData";
import { useState } from "react";

export const useFetchCells = (type?: string) => {
  const [loadingCells, setLoading] = useState(false);
  const [cells = [], setData] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchCellsData = async (params?: CellGETParameters) => {
    setLoading(true);

    try {
      const data = await fetchCells(params);

      if (data && data.data) {
        if (type === "dropdown") {
          const formatData = formatSelectData(data.data, "name", "_id");

          setData(formatData);
          setLoading(false);

          return;
        }

        setData(data.data.data.slice(0, 10));

        setTotalPages(data.data.total);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch cells:", error);

      setLoading(false);
    }
  };

  return {
    cells,
    loadingCells,
    fetchCellsData,
    setLoading,
    totalPages,
  };
};

export const useFetchCellsBySector = (type?: string, valueName = "_id") => {
  const [loadingCells, setLoading] = useState(false);
  const [cells = [], setData] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchCellsBySectorData = async (sectorId: string, status?: string) => {
    setLoading(true);

    try {
      const data = await fetchCellsBySector(sectorId);

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

        setData(data.data.data);

        setTotalPages(data.data.total);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch cells:", error);

      setLoading(false);
    }
  };

  return {
    cells,
    loadingCells,
    fetchCellsBySectorData,
    setLoading,
    totalPages,
  };
};
