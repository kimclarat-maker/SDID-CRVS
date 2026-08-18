import React from "react";

export type UISearchItemType = {
  title: string;
  description?: string;
  showUserPhoto?: boolean;
  index: number;
  rightContent?: React.ReactNode;
  onItemClicked?: () => void;
};
