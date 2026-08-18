import { useState } from "react";
import {
  fetchTransferredSchedules,
  fetchTransferredScheduleById,
} from "@/api/transfers";
import { TransferType, GETParameters } from "@/types/Transfers";

export const useFetchSchedulesTransferred = () => {
  const [loading, setLoading] = useState(false);
  const [data = [], setData] = useState<TransferType[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchTransferredSchedulesData = async (params: GETParameters) => {
    setLoading(true);
    try {
      const data = await fetchTransferredSchedules(params);

      if (data && data.data) {
        setData(data.data);
        setTotalPages(data.total);
        setLoading(false);

        return;
      }
    } catch (error) {
      console.error("Failed to fetch transfers:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    fetchTransferredSchedulesData,
    setLoading,
    totalPages,
  };
};

export const useFetchTransferById = () => {
  const [loading, setLoading] = useState(false);
  const [data = {}, setData] = useState<TransferType>();

  const fetchTransferredByIdData = async (id: string) => {
    setLoading(true);
    try {
      const data = await fetchTransferredScheduleById(id);

      if (data) {
        setData(data);
        setLoading(false);

        return;
      }
    } catch (error) {
      console.error("Failed to fetch transfers by id:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    fetchTransferredByIdData,
    setLoading,
  };
};
