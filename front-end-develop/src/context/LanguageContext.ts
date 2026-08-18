import { LanguageContextType } from "@/types/Language";
import { createContext } from "react";

export const LanguageContext = createContext<LanguageContextType>({
  translation: "",
  setLanguage: () => {},
});
