import {
  fetchEnrollmentById,
  fetchEnrollments,
  fetchBioRefreshHistory,
  fetchBiometricById,
} from "@/api/enrollments";
import { GETParameters, EnrollmentType } from "@/types/Enrollment";
import { useState } from "react";

export const useFetchEnrollments = () => {
  const [loading, setLoading] = useState(false);
  const [data = [], setData] = useState<EnrollmentType[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchEnrollmentData = async (params: GETParameters, type?: string) => {
    setLoading(true);
    try {
      const data = await fetchEnrollments(params, type);

      if (data && data.data) {
        setData(data.data);
        setTotalPages(data.total);
        setLoading(false);

        return data;
      }
    } catch (error) {
      console.error("Failed to fetch Enrollment:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    fetchEnrollmentData,
    setLoading,
    totalPages,
  };
};

export const useFetchEnrollmentById = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EnrollmentType>({} as EnrollmentType);

  const fetchEnrollmentData = async (id: string, isStartedOnline?: boolean) => {
    setLoading(true);
    try {
      const data: any = await fetchEnrollmentById(id, isStartedOnline);

      if (data && data.data) {
        setData(data.data);
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
    fetchEnrollmentData,
    setLoading,
    setData,
  };
};

interface HistoryType {
  face: any;
  iris: any;
  fingerprint: any;
  signature: any;
}

export const useFetchEnrollmentBiometricHistory = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HistoryType>();

  const fetchEnrollmentData = async (id: string) => {
    setLoading(true);
    try {
      const data: any = await fetchBioRefreshHistory(id);

      if (data && data) {
        setData(data);
        setLoading(false);

        return;
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    fetchEnrollmentData,
    setLoading,
    setData,
  };
};

export const useFetchEnrollmentBiometricById = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>([]);

  const fetchEnrollmentData = async (params: any) => {
    setLoading(true);
    try {
      const data: any = await fetchBiometricById(params);

      if (data && data) {
        setData(data);
        setLoading(false);

        return;
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    fetchEnrollmentData,
    setLoading,
    setData,
  };
};
