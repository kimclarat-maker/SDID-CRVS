import {
  fetchEnrollmentSkipSelfie,
  fetchPrenrollmentSkipSelfie,
} from "@/api/skipSelfie";
import { GETParameters, EnrollmentType } from "@/types/Enrollment";
import { useState } from "react";
import { boolean } from "yup";

export const useFetchPrenrollmentSelfieSkip = () => {
  const [loading, setLoading] = useState(false);
  const [data = [], setData] = useState<EnrollmentType[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchPrenrollmentSkipSelfieData = async (
    params: GETParameters,
    isStartedOnline?: boolean
  ) => {
    setLoading(true);
    try {
      console.log("isStartedOnline", isStartedOnline);
      const data = await fetchPrenrollmentSkipSelfie(params, isStartedOnline);

      if (data && data.data) {
        setData(data.data);
        setTotalPages(data.total);
        setLoading(false);

        return;
      }
    } catch (error) {
      console.error("Failed to fetch prenrollment Skip selfie:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    fetchPrenrollmentSkipSelfieData,
    setLoading,
    totalPages,
  };
};

export const useFetchEnrollmentSelfieSkip = () => {
  const [loading, setLoading] = useState(false);
  const [data = [], setData] = useState<EnrollmentType[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchEnrollmentSkipSelfieData = async (params: GETParameters) => {
    setLoading(true);
    try {
      const data = await fetchEnrollmentSkipSelfie(params);

      if (data && data.data) {
        setData(data.data);
        setTotalPages(data.total);
        setLoading(false);

        return;
      }
    } catch (error) {
      console.error("Failed to fetch enrollment Skip selfie:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    fetchEnrollmentSkipSelfieData,
    setLoading,
    totalPages,
  };
};
