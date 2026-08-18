import React from "react";

export type ButtonType = {
  text?: string;
  startIcon?: string;
  appearance?: "default" | "primary" | "link" | "subtle" | "ghost";
  onClick?: (e?: any) => void;
  endIcon?: string;
  loading?: boolean;
  size?: "lg" | "md" | "sm" | "xs";
  disabled?: boolean;
  styles?: React.CSSProperties;
  testId?: string;
  block?: boolean;
  color?: any;
  type?: "reset" | "button" | "submit" | undefined;
  hidden?: boolean;
  download?: string;
};

export type DropdownType = {
  title: any;
  children: React.ReactNode;
  appearance?: "default" | "primary" | "link" | "subtle" | "ghost";
  noCaret?: boolean;
  className?: string;
  placement?:
    | "bottomStart"
    | "bottomEnd"
    | "topStart"
    | "topEnd"
    | "leftStart"
    | "leftEnd"
    | "rightStart"
    | "rightEnd";
  minWidth?: string | number;
  size?: "lg" | "md" | "sm" | "xs";
  startIcon?: string;
  endIcon?: string;
  trigger?: "hover" | "click" | "contextMenu";
};
