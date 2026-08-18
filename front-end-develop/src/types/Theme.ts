import React from "react";

export type ThemeType = "light" | "dark" | "high-contrast";

export type ThemeContextValue = {
  theme: ThemeType;
  setTheme?: (theme: any) => void;
};
