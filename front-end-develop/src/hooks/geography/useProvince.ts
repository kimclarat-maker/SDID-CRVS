import { fetchProvinces, fetchSingleProvince } from "@/api/geography/province";
import { ProvinceGETParameters, ProvinceTypes } from "@/types/geography";
import formatSelectData from "@/utils/common/formatSelectData";
import { useState } from "react";

export const useFetchProvinces = (type?: string, valueName = "_id") => {
  const [loadingProvinces, setLoading] = useState(false);
  const [provinces = [], setData] = useState<ProvinceTypes[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchProvincesData = async (params?: ProvinceGETParameters) => {
    setLoading(true);

    try {
      const data = await fetchProvinces(params);

      if (data && data.data) {
        let formateData = formatList(data.data.data);

        if (type === "dropdown") {
          const selectFormatData = formatSelectData(
            formateData,
            "name",
            valueName
          );

          setData(selectFormatData);
          setLoading(false);

          return;
        }

        setData(formateData);

        setTotalPages(data.data.total);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch provinces:", error);

      setLoading(false);
    }
  };

  return {
    provinces,
    loadingProvinces,
    fetchProvincesData,
    setLoading,
    totalPages,
  };
};

export const useFetchProvinceById = () => {
  const [loadingProvince, setLoading] = useState(false);
  const [province = {}, setData] = useState<ProvinceTypes[]>([]);

  const fetchProvinceByIdData = async (id: string) => {
    setLoading(true);

    try {
      const data = await fetchSingleProvince(id);
      console.log("single province", data);

      if (data && data.data) {
        // setData(formatList(data.data.data));
        setLoading(false);

        return;
      }

      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch province:", error);

      setLoading(false);
    }
  };

  return {
    province,
    loadingProvince,
    fetchProvinceByIdData,
    setLoading,
  };
};

const formatList = (data: any) => {
  return data.map((el: any) => {
    if (
      el.name.toUpperCase() === "KIGALI" ||
      el.name.toUpperCase() === "KIGALI CITY"
    ) {
      el.name = "UMUJYI WA KIGALI";
    }

    if (el.name.toUpperCase() === "SOUTH") {
      el.name = "Amajyepfo";
    }

    if (el.name.toUpperCase() === "NORTH") {
      el.name = "Amajyaruguru";
    }

    if (el.name.toUpperCase() === "WEST") {
      el.name = "Iburasirazuba";
    }

    if (el.name.toUpperCase() === "EST") {
      el.name = "Iburengerazura";
    }

    return el;
  });
};
