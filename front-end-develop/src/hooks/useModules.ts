import { fetchModules } from "@/api/modules";
import { GETParameters, ModuleType } from "@/types/Modules";
import formatSelectData from "@/utils/common/formatSelectData";
import { useState } from "react";

export const useFetchModules = (type?: string) => {
  const [loadingModules, setLoading] = useState(false);
  const [modules, setData] = useState<ModuleType[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchModulesData = async (params: GETParameters) => {
    setLoading(true);

    try {
      const data = await fetchModules(params);

      let response: any = data.data;

      if (params && params.id) {
        response = [data];
      }

      if (type === "dropdown") {
        const formatData = formatSelectData(response, "name", "value");

        setData(formatData);
        setLoading(false);

        return;
      }
      setData(response);

      data.total && setTotalPages(data.total);

      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    } finally {
      setLoading(false);
    }
  };

  return { modules, loadingModules, fetchModulesData, setLoading, totalPages };
};
