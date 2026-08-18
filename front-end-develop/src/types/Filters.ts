import React from "react";

export type FilterContextType = {
  filters: any;
  setFilters: (lng: any) => void;
};

export type UIFilterSectionType = {
  title?: string;
  sections?: React.ReactNode[];
  styles?: any;
};

export type APIFilter = {
  center?: string;
  province?: string;
  startDate?: string;
  endDate?: string;
};
