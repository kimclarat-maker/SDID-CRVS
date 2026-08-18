import List from "./list";
import { useEffect, useState } from "react";
import { useFetchCountries } from "@/hooks/geography/useCountries";

function Countries() {
  const { countries, loadingCountries, fetchCountriesData, totalPages } =
    useFetchCountries();

  const [filters, setFilters] = useState<any>({});

  const fetchData = (params: any) => {
    fetchCountriesData({
      ...params,
      limit: params.limit || 10,
      name:
        params.search && params.search !== ""
          ? params.search.toLowerCase()
          : undefined,
      order: params?.order || "desc",
    });
  };

  useEffect(() => {
    fetchData(filters);
  }, [filters]);

  return (
    <div className="row">
      <div data-testid="country-list">
        <List
          data={countries}
          loading={loadingCountries}
          setFilters={setFilters}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}

export default Countries;
