import { apiHandler } from "@/api";
import { clearStorage, getStorage, setStorage } from "@/utils/storage";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";

type LocalServiceStatus = {
  isOnline: boolean; // Only reflects network connectivity
  isLocalServiceActive: boolean; // Separate status for local service
  isModalOpen: boolean;
  closeModal: () => void;
  retryLocalService: () => void;
  networkHealthData?: any; // Data from network health check
  localServiceHealthData?: any; // Data from local service health check
};

const LocalServiceContext = createContext<LocalServiceStatus | undefined>(
  undefined
);

interface LocalServiceProviderProps {
  children: ReactNode;
  checkInterval?: number;
  healthCheckTimeout?: number;
  localServiceEndpoint?: string;
}

export const LocalServiceProvider = ({
  children,
  checkInterval = 5000,
  healthCheckTimeout = 3000,
  localServiceEndpoint = "https://localhost:12212/api/v1/health",
}: LocalServiceProviderProps) => {
  const [status, setStatus] = useState({
    isOnline: navigator.onLine,
    isLocalServiceActive: false,
    isModalOpen: false,
  });
  const [healthOfflineData, setHealthOfflineData] = useState<any>(null);
  const [healthOnlineData, setHealthOnlineData] = useState<any>(null);

  const checkTimeoutRef = useRef<NodeJS.Timeout>();
  const healthCheckControllerRef = useRef<AbortController>();
  const modalAlreadyShown = useRef(false);

  const firstCheckDone = useRef(false);

  const cleanup = useCallback(() => {
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    healthCheckControllerRef.current?.abort();
  }, []);

  const performHealthCheck = useCallback(async () => {
    cleanup();

    try {
      healthCheckControllerRef.current = new AbortController();
      setTimeout(
        () => healthCheckControllerRef.current?.abort(),
        healthCheckTimeout
      );

      const isOnline = navigator.onLine;
      let isLocalServiceActive = false;
      let localResponseData = null;

      const localResponse = await fetch(localServiceEndpoint, {
        method: "GET",
        // signal: healthCheckControllerRef.current.signal,
        // cache: "no-store",
      });

      isLocalServiceActive = localResponse.ok;

      if (localResponse.ok) {
        try {
          localResponseData = await localResponse.json();
        } catch (e) {
          console.warn("Failed to parse local service health response", e);
        }
      }

      const prevNetworkState = localStorage.getItem("NETWORK_STATE");
      const prevServiceState = localStorage.getItem("SERVICE_STATE");
      const revalidateAccountState = localStorage.getItem("REVALIDATE");

      // Now update localStorage with new states
      localStorage.setItem("NETWORK_STATE", isOnline ? "ONLINE" : "OFFLINE");
      localStorage.setItem(
        "SERVICE_STATE",
        isLocalServiceActive ? "ACTIVE" : "INACTIVE"
      );

      // Detect changes
      let networkChanged: any = false,
        serviceChanged: any = false,
        accountRevalidated: any = false;

      if (firstCheckDone.current) {
        networkChanged =
          prevNetworkState &&
          prevNetworkState !== (isOnline ? "ONLINE" : "OFFLINE");

        serviceChanged =
          prevServiceState &&
          prevServiceState !== (isLocalServiceActive ? "ACTIVE" : "INACTIVE");
        accountRevalidated =
          !revalidateAccountState || revalidateAccountState !== "COMPLETED";
      }

      const shouldShowModal =
        (networkChanged || serviceChanged) && !modalAlreadyShown.current;

      if (shouldShowModal) {
        localStorage.setItem("REVALIDATE", "INITIATED");
      }

      firstCheckDone.current = true;

      setStatus((prev) => {
        if (shouldShowModal && accountRevalidated) {
          modalAlreadyShown.current = true;
          return {
            isOnline,
            isLocalServiceActive,
            isModalOpen: true,
          };
        }

        // Reset flag if everything is back to normal
        if (modalAlreadyShown.current) {
          modalAlreadyShown.current = false;
        }

        return {
          ...prev,
          isOnline,
          isLocalServiceActive,
          isModalOpen: prev.isModalOpen && (!isOnline || !isLocalServiceActive),
        };
      });

      // Update health data
      if (isOnline) {
        setHealthOnlineData({ timestamp: Date.now(), online: true });
      } else {
        setHealthOnlineData(null);
      }

      if (isLocalServiceActive) {
        setHealthOfflineData(
          localResponseData || { timestamp: Date.now(), active: true }
        );
      } else {
        setHealthOfflineData(null);
      }
    } catch (error) {
      console.error("Health check error:", error);
      setStatus((prev) => ({
        isOnline: navigator.onLine,
        isLocalServiceActive: false,
        isModalOpen: prev.isModalOpen,
      }));
      setHealthOnlineData(null);
      setHealthOfflineData(null);
    } finally {
      checkTimeoutRef.current = setTimeout(performHealthCheck, checkInterval);
    }
  }, [checkInterval, healthCheckTimeout, cleanup, localServiceEndpoint]);

  // ✅ Simplified dependencies
  const closeModal = useCallback(() => {
    setStatus((prev) => ({ ...prev, isModalOpen: false }));
  }, []);

  const retryLocalService = useCallback(() => {
    cleanup();
    performHealthCheck();
  }, [cleanup, performHealthCheck]);

  useEffect(() => {
    // Initialize localStorage with current states
    localStorage.setItem(
      "NETWORK_STATE",
      navigator.onLine ? "ONLINE" : "OFFLINE"
    );
    localStorage.setItem("SERVICE_STATE", "UNKNOWN");

    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true }));
      performHealthCheck();
    };

    const handleOffline = () => {
      const prevNetworkState = localStorage.getItem("NETWORK_STATE");
      localStorage.setItem("NETWORK_STATE", "OFFLINE");

      setStatus((prev) => ({
        ...prev,
        isOnline: false,
        isLocalServiceActive: false,
      }));

      if (prevNetworkState === "ONLINE" && !modalAlreadyShown.current) {
        setStatus((prev) => ({ ...prev, isModalOpen: true }));
        modalAlreadyShown.current = true;
      }
    };

    performHealthCheck();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      cleanup();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [performHealthCheck, cleanup]);

  return (
    <LocalServiceContext.Provider
      value={{
        ...status,
        closeModal,
        retryLocalService,
        networkHealthData: healthOnlineData,
        localServiceHealthData: healthOfflineData,
      }}
    >
      {children}
    </LocalServiceContext.Provider>
  );
};

export const useLocalService = (): LocalServiceStatus => {
  const context = useContext(LocalServiceContext);
  if (!context) {
    throw new Error(
      "useLocalService must be used within a LocalServiceProvider"
    );
  }
  return context;
};
