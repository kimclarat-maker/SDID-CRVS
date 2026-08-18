import { useState, useEffect } from "react";

type DropdownOption = {
  label: string;
  value: string | number;
};

type UseDropdownDataProps = {
  fetchFunction: (params?: any) => Promise<any>;
  initialParams?: any;
};

const useDropdownData = ({
  fetchFunction,
  initialParams,
}: UseDropdownDataProps) => {
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchFunction(initialParams);
        setOptions(response);
      } catch (err) {
        setError("Failed to fetch dropdown data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchFunction, initialParams]);

  return { options, loading, error };
};

export default useDropdownData;
