import {
  fetchDistricts,
  fetchDistrictsByProvince,
} from "@/api/geography/district";
import { DistrictGETParameters, DistrictTypes } from "@/types/geography";
import formatSelectData from "@/utils/common/formatSelectData";
import { useState } from "react";

export const useFetchDistricts = (type?: string) => {
  const [loadingDistricts, setLoading] = useState(false);
  const [districts = [], setData] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchDistrictsData = async (params?: DistrictGETParameters) => {
    setLoading(true);

    try {
      const data = await fetchDistricts(params);

      if (data && data.data) {
        if (type === "dropdown") {
          const formatData = formatSelectData(data.data.data, "name", "_id");

          setData(formatData);
          setLoading(false);

          return;
        }

        setData(data.data.data);

        setTotalPages(data.data.total);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch districts:", error);

      setLoading(false);
    }
  };

  return {
    districts,
    loadingDistricts,
    fetchDistrictsData,
    setLoading,
    totalPages,
  };
};

export const useFetchDistrictsByProvince = (
  type?: string,
  valueName = "_id"
) => {
  const [loadingDistricts, setLoading] = useState(false);
  const [districts = [], setData] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchDistrictsByProvinceData = async (
    provinceId: string,
    status?: string
  ) => {
    setLoading(true);

    try {
      const data = await fetchDistrictsByProvince(provinceId, status);

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
      console.error("Failed to fetch districts:", error);

      setLoading(false);
    }
  };

  return {
    districts,
    loadingDistricts,
    fetchDistrictsByProvinceData,
    setLoading,
    totalPages,
  };
};
