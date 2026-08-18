import { ReactNode } from "react";

export type EmptyType = {
  title: string;
  icon?: string;
  description?: string;
  styles?: any;
  isFullScreen?: boolean;
  button?: ReactNode;
  onClick?: (event: any) => void;
};
