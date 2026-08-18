import React from "react";
type LayoutType = "total" | "-" | "pager" | "|" | "limit" | "skip";

export type PaginationLayoutType = {
  paginationLayout?: LayoutType[];
};
export interface TableType {
  data: any;
  children: React.ReactNode;
  bordered?: boolean;
  cellBordered?: boolean;
  handleRowClick?: (e: any) => void;
  handleSortClick?: (e: any) => void;
  loading?: boolean;
  sortType?: any;
  sortColumn?: string;
  limit?: number;
  page?: number;
  setPage?: (e: any) => void;
  handleChangeLimit?: (e: any) => void;
  totalPages?: number;
  paginationLayout?: LayoutType[];
  rowKey?: string | number;
  expandedRowKeys?: any;
  shouldUpdateScroll?: boolean;
  renderRowExpanded?: any;
  rowExpandedHeight?: any;
  searchLength?: number;
  onSearch?: (t: string) => void;
  onSortBy?: (t: any) => void;
  searchPlaceholder?: string;
}

export type ActionType = {
  name?: string;
  icon?: string;
  availabilityWhen?: string[];
  onClick: (rowData: any) => void;
  testid?: string;
};
