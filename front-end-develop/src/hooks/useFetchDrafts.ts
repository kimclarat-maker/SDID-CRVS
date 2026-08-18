import { fetchDraftById, fetchDrafts } from "@/api/drafts";
import { GETParameters, Draft } from "@/types/Draft";
import { useState } from "react";

export const useFetcDrafts = () => {
  const [loading, setLoading] = useState(false);
  const [data = [], setData] = useState<Draft[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchDraftsData = async (params: GETParameters) => {
    setLoading(true);
    try {
      const data = await fetchDrafts(params);

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
    fetchDraftsData,
    setLoading,
    totalPages,
  };
};

export const useFetchDraftById = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Draft>({} as Draft);

  const fetchDraftByIdData = async (id: string) => {
    setLoading(true);
    try {
      const data = await fetchDraftById(id);

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
    fetchDraftByIdData,
    setLoading,
    setData,
  };
};
