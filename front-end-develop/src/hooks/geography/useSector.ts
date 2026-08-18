import api from "@/api";
import { fetchSectors, fetchSectorsByDistrict } from "@/api/geography/sector";
import { SectorGETParameters, SectorTypes } from "@/types/geography";
import formatSelectData from "@/utils/common/formatSelectData";
import axios from "axios";
import { useState } from "react";

export const useFetchSectors = (type?: string, valueName = "_id") => {
  const [loadingSectors, setLoading] = useState(false);
  const [sectors = [], setData] = useState<SectorTypes[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchSectorsData = async (params?: SectorGETParameters) => {
    setLoading(true);

    try {
      const data = await fetchSectors(params);

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
      console.error("Failed to fetch sectors:", error);

      setLoading(false);
    }
  };

  return {
    sectors,
    loadingSectors,
    fetchSectorsData,
    setLoading,
    totalPages,
  };
};

export const useFetchSectorsByDistrict = (type?: string, valueName = "_id") => {
  const [loadingSectors, setLoading] = useState(false);
  const [sectors = [], setData] = useState<SectorTypes[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchSectorsByDistrictData = async (
    districtId: string,
    status?: string
  ) => {
    setLoading(true);

    try {
      const data = await fetchSectorsByDistrict(districtId, status);

      if (data && data.data) {
        if (type === "dropdown") {
          const formatData = formatSelectData(data.data, "name", valueName);

          setData(formatData);
          setLoading(false);

          return;
        }

        setData(data.data.data);

        setTotalPages(data.data.total);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch sectors:", error);

      setLoading(false);
    }
  };

  return {
    sectors,
    loadingSectors,
    fetchSectorsByDistrictData,
    setLoading,
    totalPages,
  };
};
