import { fetchRollBackById, fetchRollBacks } from "@/api/rollBacks";
import { GETParameters, RollBack } from "@/types/RollBack";
import { useState } from "react";

export const useFetchRollBacks = () => {
  const [loading, setLoading] = useState(false);
  const [data = [], setData] = useState<RollBack[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchRollBackData = async (params: GETParameters) => {
    setLoading(true);
    try {
      const data = await fetchRollBacks(params);

      if (data && data.data) {
        setData(data.data);
        setTotalPages(data.total);
        setLoading(false);

        return;
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    fetchRollBackData,
    setLoading,
    totalPages,
  };
};

export const useFetchRollBacksById = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RollBack>({} as RollBack);

  const fetchRollBackByIdData = async (id: string) => {
    setLoading(true);
    try {
      const data: any = await fetchRollBackById(id);

      if (data) {
        setData(data);
        setLoading(false);

        return;
      }
    } catch (error) {
      console.error("Failed to fetch Enrollment by id:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    fetchRollBackByIdData,
    setLoading,
    setData,
  };
};
