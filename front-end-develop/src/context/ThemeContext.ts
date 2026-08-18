import { ThemeContextValue } from "@/types/Theme";
import { createContext } from "react";

export const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
});
