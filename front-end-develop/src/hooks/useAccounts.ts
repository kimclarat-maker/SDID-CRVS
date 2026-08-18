import { fetchAccountByID, fetchAccounts } from "@/api/accounts";
import { AccountType, GETParameters } from "@/types/Account";
import { useState } from "react";

export const useFetchAccounts = (type?: string) => {
  const [loading, setLoading] = useState(false);
  const [data = [], setData] = useState<AccountType[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchAccountData = async (
    params: GETParameters,
    isRemoteFetchForceEnabled?: boolean
  ) => {
    setLoading(true);

    try {
      const data = await fetchAccounts(params, isRemoteFetchForceEnabled);

      if (data && data.data) {
        if (type === "dropdown") {
          const formatData = data.data.data.map((el: AccountType) => {
            return {
              ...el,
              label: el.firstName + " " + el.lastName,
              value: el._id,
            };
          });

          setData(formatData);
          setLoading(false);
          return;
        }

        setData(data.data.data);

        setTotalPages(data.data.total);
        setLoading(false);
        return data.data.data;
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch account:", error);

      setLoading(false);
    }
  };

  return { data, loading, fetchAccountData, setLoading, totalPages };
};

export const useFetchAccountById = () => {
  const [loading, setLoading] = useState(false);
  const [data = {}, setData] = useState<any>({});

  const fetchAccountData = async (id: string, isStartedOnline?: boolean) => {
    setLoading(true);

    try {
      console.log("skdskdjisStartedOnline", isStartedOnline);
      const data = await fetchAccountByID(id, isStartedOnline);

      setData(data.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch account history log:", error);

      setLoading(false);
    }
  };

  return { data, loading, fetchAccountData, setLoading };
};
