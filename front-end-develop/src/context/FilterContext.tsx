import { FilterContextType } from "@/types/Filters";
import moment from "moment";
import { createContext, useState } from "react";

// Define your default filters
const defaultFilters = {
  home: {
    startDate: moment().subtract(1, "month").format("YYYY-MM-DD HH:mm"),
    endDate: moment().endOf("day").format("YYYY-MM-DD HH:mm"),
  },
  reports: {
    startDate: moment().subtract(1, "month").format("YYYY-MM-DD HH:mm"),
    endDate: moment().endOf("day").format("YYYY-MM-DD HH:mm"),
  },
  enrollments: {
    startDate: moment().subtract(1, "month").format("YYYY-MM-DD HH:mm"),
    endDate: moment().endOf("day").format("YYYY-MM-DD HH:mm"),
    search: undefined,
  },
  SKIPSELFIE: {
    startDate: moment().subtract(1, "month").format("YYYY-MM-DD HH:mm"),
    endDate: moment().endOf("day").format("YYYY-MM-DD HH:mm"),
    offset: 0,
    limit: 10,
    search: undefined,
  },
};

// Create context with default values
export const FilterContext = createContext<FilterContextType>({
  filters: defaultFilters,
  setFilters: () => {},
});

export const FilterProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize state with default filters
  const [filters, setFilters] = useState(defaultFilters);

  return (
    <FilterContext.Provider value={{ filters, setFilters }}>
      {children}
    </FilterContext.Provider>
  );
};
