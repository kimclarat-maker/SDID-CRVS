import { BrowserRouter as Router } from "react-router-dom";
import "@/common/styles/global.css";
import "@/common/styles/selfie.styles.css";
import "@/common/styles/checkbox.css";
import "@/common/styles/bio-capture-styles.css";
import Public from "@/navigation/Public";
import Private from "@/navigation/Private";
import PublicSite from "@/navigation/PublicSite";
import Doc from "@/navigation/Doc";
import { Suspense, useContext, useEffect, useState, useRef } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { translations } from "@/internationalization";
import toast, { Toaster } from "react-hot-toast";

import { CustomProvider } from "rsuite";
import "rsuite/dist/rsuite.min.css";
import "@/common/styles/scrollbar.styles.css";
import "@/common/styles/tokens.css";
import "@/common/styles/framework-overrides.css";
import "@/App.less";
import { clearStorage, getStorage, setStorage } from "./utils/storage";
import { ThemeContext } from "./context/ThemeContext";
import { ThemeType } from "./types/Theme";

import Loading from "./components/loader";
import TokenExpiryBanner from "./components/inactivity/tokenExpiryBanner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SelfieProvider } from "@/context/SelfieContext";
import { AutoLogoutManager } from "./utils/autoLogout";
import { setLoginModal } from "@/api";
import toastMessage from "./utils/common/toastMessage";
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
  const [showLogin, setShowLogin] = useState(false);
  const autoLogoutManagerRef = useRef<AutoLogoutManager | null>(null);
  const { hasAccess, restoreAccess, closeCurrentTab } = useSingleTabLock();

  useEffect(() => {
    const showModal = () => {
      setShowLogin(true);
    };

    const hideModal = () => {
      setShowLogin(false);
    };
    setLoginModal(showModal, hideModal);
  }, []);

  useEffect(() => {
    const initializeAutoLogout = async () => {
      const user = await getStorage();
      const hasToken = !!user?.token;

      if (hasToken && !autoLogoutManagerRef.current) {
        // User is logged in - initialize auto logout
        autoLogoutManagerRef.current = new AutoLogoutManager(
          10, // 10 minutes timeout
          5, // 5 minutes warning
          () => {
            // Full logout action
            clearStorage();
            window.location.href = "/authentication/login";
          },
          (timeLeft) => {
            // Warning callback
            console.log("error", `Session expiring in ${timeLeft} minutes`);
          },
          () => {
            // Show modal callback
            // clearStorage();
            setShowLogin(true);
          },
          () => {
            // Hide modal callback
            setShowLogin(false);
          }
        );
      } else if (!hasToken && autoLogoutManagerRef.current) {
        // User logged out - destroy auto logout manager
        autoLogoutManagerRef.current.destroy();
        autoLogoutManagerRef.current = null;
        setShowLogin(false);

        // Clear shared activity storage
        localStorage.removeItem("EnrollmentLastActivity");
      }
    };

    initializeAutoLogout();

    return () => {
      if (autoLogoutManagerRef.current) {
        autoLogoutManagerRef.current.destroy();
        autoLogoutManagerRef.current = null;
      }
    };
  }, []);

  // Handle storage changes (for cross-tab logout)
  useEffect(() => {
    const handleStorageChange = async (event: StorageEvent) => {
      if (event.key === "PreEnrollmentLastActivity") {
        // Activity updated in another tab - no action needed as BroadcastChannel handles it
        return;
      }

      if (event.key?.includes("auth") || event.key?.includes("user")) {
        const user = await getStorage();
        const hasToken = !!user?.token;

        if (hasToken && !autoLogoutManagerRef.current) {
          // Re-initialize auto logout
          autoLogoutManagerRef.current = new AutoLogoutManager(
            5,
            3,
            () => {
              clearStorage();
              window.location.href = "/authentication/login";
            },
            (timeLeft) => {
              toastMessage("error", `Session expiring in ${timeLeft} minutes`);
            },
            () => setShowLogin(true),
            () => setShowLogin(false)
          );
        } else if (!hasToken && autoLogoutManagerRef.current) {
          autoLogoutManagerRef.current.destroy();
          autoLogoutManagerRef.current = null;
          setShowLogin(false);
          localStorage.removeItem("PreEnrollmentLastActivity");
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleSuccessfulReauth = () => {
    if (autoLogoutManagerRef.current) {
      autoLogoutManagerRef.current.handleSuccessfulReauth();
    }
    setShowLogin(false); // Close the modal on successful reauth
  };

  const handleManualLogout = () => {
    console.log("[APP] User initiated manual logout");
    if (autoLogoutManagerRef.current) {
      autoLogoutManagerRef.current.handleManualLogout();
    }
    setShowLogin(false); // Close the modal on logout
  };

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
                      <Doc />
                      <SelfieProvider>
                        <Private />
                      </SelfieProvider>
                      <TokenExpiryBanner
                        open={showLogin}
                        setOpen={setShowLogin}
                        onSuccessfulReauth={handleSuccessfulReauth}
                        onManualLogout={handleManualLogout}
                      />
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
