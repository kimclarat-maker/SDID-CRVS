export const convertObjectIntoUrlParams = (filters: any = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    // Skip null or undefined values
    if (value === null || value === undefined) {
      return;
    }

    // Handle nested objects (like country with code)
    if (typeof value === "object" && !Array.isArray(value)) {
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        if (nestedValue !== null && nestedValue !== undefined) {
          params.append(key, nestedValue.toString());
        }
      });
    }
    // Handle arrays
    // else if (Array.isArray(value)) {
    //   value.forEach((item) => {
    //     if (item !== null && item !== undefined) {
    //       params.append(key, item.toString());
    //     }
    //   });
    // }
    // Handle primitive values
    else {
      params.append(key, value.toString());
    }
  });

  return params.toString();
};

interface FilterParams {
  offset?: string;
  limit?: string;
  startDate?: string;
  endDate?: string;
  country?: string;
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
  status?: string;
  center?: string;
  statuses?: string[];
  gender?: string;
}

type FilterKeys = keyof FilterParams;
export const getFiltersFromSearchParams = (
  searchParams: URLSearchParams
): Partial<FilterParams> => {
  const result: Partial<FilterParams> = {};

  const keys: FilterKeys[] = [
    "offset",
    "limit",
    "startDate",
    "endDate",
    "country",
    "province",
    "district",
    "sector",
    "cell",
    "village",
    "status",
    "center",
    "statuses",
    "gender",
  ];

  keys.forEach((key) => {
    const value = searchParams.get(key);
    if (value !== null && value !== "") {
      // Special handling for statuses parameter
      if (key === "statuses") {
        result[key] = value.split(",");
      } else {
        result[key] = value;
      }
    }
  });

  return result;
};
