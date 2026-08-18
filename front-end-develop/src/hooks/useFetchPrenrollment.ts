import {
  fetchPrenrollmentByIdentifier,
  fetchPrenrollmentByPrenrollmentNumber,
} from "@/api/prenrollment";
import { Prenrollment } from "@/types/Prenrollment";
import { useState } from "react";

export const useFetchPrenrollmentByIdentifier = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Prenrollment>({} as Prenrollment);

  const fetchPrenrollmentByIdentifierData = async (
    identfier: string,
    refresh?: boolean
  ) => {
    setLoading(true);
    try {
      const data = await fetchPrenrollmentByIdentifier(identfier, refresh);

      if (data && data.data) {
        setData(data.data);
        setLoading(false);
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
    fetchPrenrollmentByIdentifierData,
    setLoading,
  };
};

export const useFetchPrenrollmentByPrenrollmentNo = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Prenrollment>({} as Prenrollment);

  const fetchPrenrollmentByPrenrollmentNoData = async (
    prenrollmentNo: string,
    refresh?: boolean,
    isStartedOnline?: boolean
  ) => {
    setLoading(true);
    try {
      const data = await fetchPrenrollmentByPrenrollmentNumber(
        prenrollmentNo,
        refresh,
        isStartedOnline
      );

      if (data && data.data) {
        setData(data.data);
        setLoading(false);

        return data.data;
      }
    } catch (error) {
      console.error("Failed to fetch pr no:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    fetchPrenrollmentByPrenrollmentNoData,
    setLoading,
  };
};
