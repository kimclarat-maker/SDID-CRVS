import { fetchCountries, fetchSingleCountry } from "@/api/geography/countries";
import { CountryGETParameters } from "@/types/geography";
import { CountryTypes } from "@/types/geography";
import formatSelectData from "@/utils/common/formatSelectData";
import { useState } from "react";

export const useFetchCountries = (type?: string) => {
  const [loadingCountries, setLoading] = useState(false);
  const [countries = [], setData] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchCountriesData = async (params?: CountryGETParameters) => {
    setLoading(true);

    try {
      const data = await fetchCountries(params);

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
      console.error("Failed to fetch countries:", error);

      setLoading(false);
    }
  };

  return {
    countries,
    loadingCountries,
    fetchCountriesData,
    setLoading,
    totalPages,
  };
};

export const useFetchCountryById = (type?: string) => {
  const [loadingCountry, setLoading] = useState(false);
  const [countryInfo = {}, setData] = useState<CountryTypes>();

  const fetchCountryByIdData = async (id: string) => {
    setLoading(true);

    try {
      const data = await fetchSingleCountry(id);

      if (data && data.data) {
        setData(data.data);
      }
      setLoading(false);

      return data.data;
    } catch (error) {
      console.error("Failed to fetch country by id:", error);

      setLoading(false);
    }
  };

  return {
    countryInfo,
    loadingCountry,
    fetchCountryByIdData,
    setLoading,
  };
};
