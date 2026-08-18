import { GETParameters, ScheduleType } from "@/types/Schedule";
import { useState } from "react";
import { fetchSchedules, fetchSchedulesCalendar } from "@/api/schedules";

export const useFetchSchedules = () => {
  const [loading, setLoading] = useState(false);
  const [data = [], setData] = useState<ScheduleType[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchSchedulesData = async (params: GETParameters) => {
    setLoading(true);
    try {
      const data = await fetchSchedules(params);

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
    fetchSchedulesData,
    setLoading,
    totalPages,
  };
};

export const useFetchSchedulesCalendar = () => {
  const [loading, setLoading] = useState(false);
  const [data = [], setData] = useState<ScheduleType[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchSchedulesData = async (params: GETParameters) => {
    setLoading(true);
    try {
      const data = await fetchSchedulesCalendar(params);

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
    fetchSchedulesData,
    setLoading,
    totalPages,
  };
};
