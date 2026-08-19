import { BrowserRouter as Router } from "react-router-dom";
import "@/common/styles/global.css";
import "@/common/styles/selfie.styles.css";
import "@/common/styles/checkbox.css";
import "@/common/styles/bio-capture-styles.css";
import Public from "@/navigation/Public";
import Private from "@/navigation/Private";
import PublicSite from "@/navigation/PublicSite";
import { Suspense, useContext, useEffect, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { translations } from "@/internationalization";
import { Toaster } from "react-hot-toast";

import { CustomProvider } from "rsuite";
import "rsuite/dist/rsuite.min.css";
import "@/common/styles/scrollbar.styles.css";
import "@/common/styles/tokens.css";
import "@/common/styles/framework-overrides.css";
import "@/App.less";
import { getStorage, setStorage } from "./utils/storage";
import { ThemeContext } from "./context/ThemeContext";
import { ThemeType } from "./types/Theme";

import Loading from "./components/loader";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SelfieProvider } from "@/context/SelfieContext";
import { useSingleTabLock } from "./hooks/useSingleTabLock";
import AppAlreadyOpen from "./components/message/alreadyOpen";

const queryClient = new QueryClient();

function LanguageUpdater() {
  const { setLanguage } = useContext(LanguageContext);

  useEffect(() => {
    const getLanguage = async () => {
      const storedLanguage = (await getStorage("language")) || "english";
      setLanguage(storedLanguage);
      await setStorage(storedLanguage, "language");
    };

    getLanguage();
  }, [setLanguage]);

  return null;
}

function App() {
  const [language, setLanguage] = useState("english");
  const [theme, setTheme] = useState<ThemeType>("light");
  const { hasAccess, restoreAccess, closeCurrentTab } = useSingleTabLock();

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <CustomProvider theme={theme}>
          <ThemeContext.Provider value={{ theme, setTheme }}>
            <LanguageContext.Provider
              value={{
                translation: translations[language],
                setLanguage,
              }}
            >
              <Router
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
                }}
              >
                <Suspense fallback={<Loading isFullScreen />}>
                  <LanguageUpdater />
                  {!hasAccess ? (
                    <AppAlreadyOpen
                      restoreAccess={restoreAccess}
                      closeCurrentTab={closeCurrentTab}
                    />
                  ) : (
                    <>
                      <PublicSite />
                      <Public />
                      <SelfieProvider>
                        <Private />
                      </SelfieProvider>
                    </>
                  )}
                </Suspense>
              </Router>
            </LanguageContext.Provider>
          </ThemeContext.Provider>
        </CustomProvider>
        <Toaster />
      </QueryClientProvider>
    </>
  );
}

export default App;
