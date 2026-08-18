import {
  fetchHolidays,
  fetchHolidaysAll,
  fetchHolidaysByYear,
} from "@/api/holidays";
import { HolidayType } from "@/types/Holidays";
import formatSelectData from "@/utils/common/formatSelectData";
import moment from "moment";
import { useState } from "react";

export const useHolidays = () => {
  const [loadingHolidays, setLoading] = useState(false);
  const [holidays, setData] = useState<HolidayType[]>([]);

  const fetchHolidaysData = async () => {
    setLoading(true);

    try {
      const data = await fetchHolidays();
      if (data && data.data) {
        const modifiedData = data.data?.map((el: string) => {
          return {
            date: moment(el).format("YYYY-MM-DD"),
            label: moment(el).format("YYYY-MM-DD"),
            value: moment(el).format("YYYY-MM-DD"),
          };
        });

        setData(modifiedData);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch holidays:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loadingHolidays,
    holidays,
    fetchHolidaysData,
    setLoading,
  };
};

export const useHolidaysByYear = (type?: string) => {
  const [loadingHolidaysByYear, setLoading] = useState(false);
  const [holidaysByYear, setData] = useState<HolidayType[]>([]);

  const fetchHolidaysByYearData = async (year: number) => {
    setLoading(true);

    try {
      const data = await fetchHolidaysByYear(year);
      if (data && data.data) {
        const modifiedData = data.data?.map((el: any) => {
          return {
            ...el,
            date: moment(el.holidayDate).format("YYYY-MM-DD"),
            label: moment(el.holidayDate).format("YYYY-MM-DD"),
            value: moment(el.holidayDate).format("YYYY-MM-DD"),
          };
        });

        if (type === "dropdown") {
          const formatData = formatSelectData(modifiedData, "date", "date");

          setData(formatData);
          setLoading(false);

          return;
        }
        setData(modifiedData);
      }

      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch holidays:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loadingHolidaysByYear,
    holidaysByYear,
    fetchHolidaysByYearData,
    setLoading,
  };
};

export const useHolidaysAll = (type?: string) => {
  const [loadingAllHolidays, setLoading] = useState(false);
  const [allHolidays, setData] = useState<HolidayType[]>([]);

  const fetchAllHolidaysData = async () => {
    setLoading(true);

    try {
      const data = await fetchHolidaysAll();
      if (data && data.data) {
        const modifiedData = data.data?.map((el: any) => {
          return {
            ...el,
            holidayDate: moment(el.holidayDate).format("YYYY-MM-DD"),
            label: moment(el.holidayDate).format("YYYY-MM-DD"),
            value: moment(el.holidayDate).format("YYYY-MM-DD"),
          };
        });
        setData(modifiedData);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch holidays:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loadingAllHolidays,
    allHolidays,
    fetchAllHolidaysData,
  };
};
