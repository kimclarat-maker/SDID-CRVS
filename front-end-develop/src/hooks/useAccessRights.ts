import { fetchAccessRights } from "@/api/rights";
import { GETParameters } from "@/types/AccessRight";
import formatSelectData from "@/utils/common/formatSelectData";
import { useState } from "react";

export const useFetchAccessRights = (type?: string) => {
  const [loadingAccessRights, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchAccessRightsData = async (params: GETParameters) => {
    setLoading(true);

    try {
      const data = await fetchAccessRights(params);

      let response: any = data.data;

      if (params && params.id) {
        response = [data];
      }

      if (type === "dropdown") {
        const formatData = formatSelectData(response, "module", "_id");

        setData(formatData);
        setLoading(false);

        return;
      }
      setData(response);

      data.total && setTotalPages(data.total);

      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch access rights:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    accessRights: data,
    loadingAccessRights,
    fetchAccessRightsData,
    setLoading,
    totalPages,
  };
};
