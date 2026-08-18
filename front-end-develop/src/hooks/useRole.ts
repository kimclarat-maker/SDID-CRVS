import { fetchRoleMenus, fetchRoles } from "@/api/roles";
import { GETParameters, GETMenusParameters, RoleType } from "@/types/ROLE";
import formatSelectData from "@/utils/common/formatSelectData";
import { useState } from "react";

export const useFetchRole = (type?: string) => {
  const [loadingRoles, setLoading] = useState(false);
  const [data, setData] = useState<RoleType[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchRolesData = async (params?: GETParameters) => {
    setLoading(true);

    try {
      const data = await fetchRoles(params);

      let response: any = data?.data;

      if (params && params.id) {
        response = [data];
      }

      if (type === "dropdown") {
        const formatData = response.map((el: any) => {
          return {
            ...el,
            label: el.name,
            value: el._id,
            type: el.value,
            level: el.value,
          };
        });

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

  return { roles: data, loadingRoles, fetchRolesData, setLoading, totalPages };
};

export const useFetchRoleMenus = () => {
  const [loadingMenus, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchRoleMenusData = async (params?: GETMenusParameters) => {
    setLoading(true);

    try {
      const resData = await fetchRoleMenus(params);

      if (resData && resData.data) {
        setData(resData.data.data);

        setTotalPages(resData.data.total);
      }
    } catch (error) {
      console.error("Failed to fetch role menus:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    menus: data,
    loadingMenus,
    fetchRoleMenusData,
    setLoading,
    totalPages,
  };
};
