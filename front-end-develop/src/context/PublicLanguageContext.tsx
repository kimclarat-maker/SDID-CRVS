import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { platformConfig } from "@/config/platform.config";
import { getPublicContent } from "@/config/publicContent";
import { PublicContent } from "@/types/PublicContent";

const STORAGE_KEY = "publicLanguage";

interface PublicLanguageContextValue {
  languageCode: string;
  setLanguageCode: (code: string) => void;
  content: PublicContent;
}

const PublicLanguageContext = createContext<PublicLanguageContextValue>({
  languageCode: platformConfig.defaultLanguage,
  setLanguageCode: () => {},
  content: getPublicContent(platformConfig.defaultLanguage),
});

function getInitialLanguage(): string {
  if (typeof window === "undefined") return platformConfig.defaultLanguage;
  return window.localStorage.getItem(STORAGE_KEY) || platformConfig.defaultLanguage;
}

export function PublicLanguageProvider({ children }: { children: ReactNode }) {
  const [languageCode, setLanguageCodeState] = useState<string>(getInitialLanguage);

  const setLanguageCode = (code: string) => {
    setLanguageCodeState(code);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, code);
    }
  };

  const content = useMemo(() => getPublicContent(languageCode), [languageCode]);

  return (
    <PublicLanguageContext.Provider
      value={{ languageCode, setLanguageCode, content }}
    >
      {children}
    </PublicLanguageContext.Provider>
  );
}

export function usePublicLanguage() {
  return useContext(PublicLanguageContext);
}
