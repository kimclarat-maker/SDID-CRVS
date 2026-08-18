import { cfg } from "@/constants/cfg";
import { EXCLUDED_MESSAGES } from "@/constants/errors";
import { defineAccess } from "@/utils/common/permissions";
import toastMessage from "@/utils/common/toastMessage";
import { clearStorage, getStorage, setStorage } from "@/utils/storage";
import axios from "axios";

// FIXED retry mechanism for localStorage access
const getLocalStorageWithRetry = async (
  key: string,
  maxRetries = 5
): Promise<string | null> => {
  console.log(`🔄 Starting localStorage retrieval for: "${key}"`);

  for (let i = 0; i < maxRetries; i++) {
    try {
      const value = localStorage.getItem(key);
      console.log(`📝 Attempt ${i + 1}/${maxRetries}:`, {
        key,
        value,
        isNull: value === null,
        isUndefined: value === undefined,
      });

      // If we get a non-null value, return it immediately
      if (value !== null) {
        console.log(`✅ Found value: "${value}"`);
        return value;
      }

      // If this is the last attempt, return null
      if (i === maxRetries - 1) {
        console.log(`❌ All retries exhausted, key "${key}" not found`);
        return null;
      }

      // Wait before retrying (increasing delay)
      const delay = Math.pow(2, i) * 50; // 50ms, 100ms, 200ms, 400ms, 800ms
      console.log(`⏳ Waiting ${delay}ms before next retry...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error) {
      console.warn(`🚨 localStorage access attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) {
        console.error("💥 All retries failed due to errors");
        return null;
      }

      const delay = Math.pow(2, i) * 50;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return null;
};

// Whitelist of API endpoints that should use local service
const LOCAL_SERVICE_WHITELIST: any = [
  "pre-enrollment/search/:identifier/identifier",
  "pre-enrollment/search/:preEnrollmentNo/pre-enrollment-no",
  "pre-enrollment/search/applicant-selfie-match",
  "enrollment/start/:preEnrollmentId",
  "enrollment/:id",
  "media",
  "media/:id",
  "enrollment/add-selfie",
  "enrollment/add-fingerprint",
  "enrollment/add-signature",
  "enrollment/submit/:enrollmentId",
  "auth/login",
  "auth/mfa/verify-email",
  "auth/mfa/verify-face",
  "/auth/send-session-renew-code/face-verification",
  "auth/mfa/verify-embedding",
  "enrollment/biometric-history/:id",
  "enrollment/offline",
  "pre-enrollment/applicant-selfie/skip-action",
  "pre-enrollment/verify/skip-code",
  "enrollment/pair-validate/selfie-skip-action",
  "enrollment/pair-validate/selfie-skip-verify",
  "accounts",
  "enrollment/pair-validate/selfie-skip",
  "enrollment/pair-validate/selfie-skip-action",
  "enrollment/pair-validate/selfie-skip-verify",
  "configuration/supporting-documents/:fieldName",
  "configuration/supporting-documents",
  "auth/mfa/send-otp-by-email",
  "pre-enrollment/search/all",
  "enrollment/pair-validate/selfie-skip-direct",
  "enrollment/refresh-pair-validate/selfie-skip-direct",
  "auth/logout",
  "enrollment/refresh-face",
  "auth/sync-account-data",
  "pre-enrollment/search/applicant-selfie-without-face-verification",
];

const FORCE_REMOTE_API_ENDPOINTS: string[] = [
  // "enrollment/pair-validate",
];

type EnvConfig = {
  API_KEY: string;
  API_SECRET_KEY: string;
  NODE_ENV: "development" | "production" | "test";
  [key: string]: string;
};

let showLoginModal: (() => void) | null = null;
let hideLoginModal: (() => void) | null = null;

// Export functions to set up the modal from your React components
export const setLoginModal = (showModal: () => void, hideModal: () => void) => {
  showLoginModal = showModal;
  hideLoginModal = hideModal;
};

const getEnvConfig = (): EnvConfig => {
  const env = cfg;
  return {
    API_KEY: env.VITE_API_KEY || "",
    API_SECRET_KEY: env.VITE_API_SECRET_KEY || "",
    NODE_ENV: env.VITE_NODE_ENV as "development" | "production" | "test",
  };
};

// Helper function to convert whitelist patterns to regex
const createPatternMatcher = (whitelistedPath: string) => {
  // Convert pattern to regex by replacing parameters with wildcards
  const regexPattern = whitelistedPath
    .replace(/:.+?(\/|$)/g, "[^/]+$1") // Replace :param with [^/]+
    .replace(/\//g, "\\/"); // Escape slashes

  return new RegExp(`^.*${regexPattern}$`);
};

// Check if endpoint is whitelisted
const isWhitelistedEndpoint = (endpoint: string): boolean => {
  return LOCAL_SERVICE_WHITELIST.some((whitelistedPath: any) => {
    const regex = createPatternMatcher(whitelistedPath);
    return regex.test(endpoint);
  });
};

export const apiHandler = async (
  type?: string,
  endpoint?: string,
  useRemoteApi: boolean = false,
  isLocalServiceEnabled?: boolean,
  isRemoteFetchForceEnabled?: boolean
) => {
  const env = cfg.VITE_NODE_ENV;
  if (!env) return;
  let url = cfg.VITE_API_BASE_URL; // This is the REMOTE API

  if (type === "apiGateway") {
    return url;
  }

  try {
    // Use retry mechanism for localStorage
    const localServiceState = await getLocalStorageWithRetry("SERVICE_STATE");

    //CHECK FOR FORCED REMOTE ENDPOINTS FIRST
    const shouldForceRemote =
      endpoint &&
      FORCE_REMOTE_API_ENDPOINTS.some((forcedEndpoint) =>
        createPatternMatcher(forcedEndpoint).test(endpoint)
      );

    const canUseOffline = defineAccess({
      method: "get",
      module: "offline",
    });

    const loginType = await getStorage("loginType", "local");

    // If explicitly requested to use remote API, use remote API directly
    if (
      (loginType === "remote" || loginType === '"remote"') &&
      !endpoint?.includes("auth/sync-account-data")
    ) {
      return url;
    }

    if (
      useRemoteApi ||
      shouldForceRemote ||
      isRemoteFetchForceEnabled ||
      (!endpoint?.includes("auth") &&
        !endpoint?.includes("offline") &&
        !endpoint?.includes("auth/sync-account-data") &&
        loginType === "remote")
    ) {
      return url;
    }

    // Check if we should use local service
    const shouldUseLocalService =
      localServiceState === "ACTIVE" &&
      endpoint &&
      isWhitelistedEndpoint(endpoint);

    if (localServiceState === "ACTIVE") {
      if (
        endpoint?.includes("auth") &&
        (isLocalServiceEnabled || (endpoint && isWhitelistedEndpoint(endpoint)))
      ) {
        url = cfg.VITE_LOCAL_SERVICE_API;
      } else if (
        canUseOffline &&
        (isLocalServiceEnabled || shouldUseLocalService)
      ) {
        url = cfg.VITE_LOCAL_SERVICE_API;
      }
    }
    console.log("URL:", url);
    return url;
  } catch (error) {
    return url;
  }
};

// Rest of your code remains the same...
const handleRefreshToken = async () => {
  try {
    const user = await getStorage();
    const { refreshToken } = user;
    const baseURL = await apiHandler();
    const response = await axios.post(
      `${baseURL}/auth/refresh-token`,
      {
        refreshToken,
      },
      {
        headers: {
          ["x-sdid-api-key"]: cfg.VITE_API_KEY,
          ["x-sdid-api-secret-key"]: cfg.VITE_API_SECRET_KEY,
        },
      }
    );

    user.token = response.data.token;
    user.refreshToken = response.data.refreshToken;

    await setStorage(user);
  } catch (error) {
    clearStorage();
    // Instead of redirecting, show login modal
    if (showLoginModal) {
      showLoginModal();
    }
  }
};

export const createAxiosInstance = async (
  endpoint?: string,
  isLocalServiceEnabled?: boolean,
  isRemoteFetchForceEnabled?: boolean
) => {
  const { API_KEY, API_SECRET_KEY } = getEnvConfig();

  if (!API_KEY || !API_SECRET_KEY) {
    throw new Error("API credentials not configured");
  }

  const baseURL = await apiHandler(
    undefined,
    endpoint,
    false,
    isLocalServiceEnabled,
    isRemoteFetchForceEnabled
  );

  if (!baseURL) {
    throw new Error("API baseURL not configured");
  }

  const instance = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
      "x-sdid-api-key": API_KEY,
      "x-sdid-api-secret-key": API_SECRET_KEY,
      "x-sdid-timestamp": new Date().getTime(),
      "x-sdid-locale": Intl.DateTimeFormat().resolvedOptions().locale,
    },
  });

  instance.interceptors.request.use(
    async (config) => {
      config.headers["x-sdid-api-key"] = cfg.VITE_API_KEY;
      config.headers["x-sdid-api-secret-key"] = cfg.VITE_API_SECRET_KEY;
      config.headers["x-sdid-timestamp"] = new Date().getTime();
      config.headers["x-sdid-locale"] =
        Intl.DateTimeFormat().resolvedOptions().locale;

      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalConfig = error.config;
      if (!originalConfig) return Promise.reject(error);

      const endpoint = originalConfig.url;
      const baseURL = originalConfig.baseURL || cfg.VITE_API_BASE_URL;

      const retryableStatus = [500, 502, 404];
      const isLocalHost =
        baseURL.includes("localhost") || baseURL.includes("127.0.0.1");

      // Initialize retry count
      originalConfig._retryCount = originalConfig._retryCount || 0;
      const MAX_RETRY = endpoint?.includes("auth") ? 2 : 5;

      // Retry if network/server error or 404 for whitelisted endpoints
      if (
        (error.response && retryableStatus.includes(error.response.status)) ||
        (error.response?.status === 404 &&
          endpoint &&
          isWhitelistedEndpoint(endpoint))
      ) {
        if (originalConfig._retryCount < MAX_RETRY) {
          originalConfig._retryCount += 1;
          const delay = Math.min(
            1000 * Math.pow(2, originalConfig._retryCount - 1),
            5000
          );

          console.log(
            `Retrying ${endpoint} (attempt ${originalConfig._retryCount}) on ${
              isLocalHost ? "localhost" : "remote"
            } after ${delay}ms`
          );
          await new Promise((res) => setTimeout(res, delay));

          // Keep using localhost if it was localhost
          if (isLocalHost) {
            originalConfig.baseURL = cfg.VITE_LOCAL_SERVICE_API;
          } else if (
            !originalConfig._retriedWithRemoteApi &&
            isWhitelistedEndpoint(endpoint)
          ) {
            // Only switch to remote if not retried yet
            originalConfig.baseURL = cfg.VITE_API_BASE_URL;
            originalConfig._retriedWithRemoteApi = true;
          }

          return instance(originalConfig);
        } else {
          console.log("Maximum retry attempts reached for " + endpoint);
        }
      }

      return Promise.reject(error);
    }
  );
  return instance;
};

type CONFIG = {
  method: string;
  url: string;
  body?: any;
  data?: any;
  params?: any;
  headers?: any;
  isLocalServiceEnabled?: boolean;
  isRemoteFetchForceEnabled?: boolean;
};

const api = async (config: CONFIG) => {
  const userLoggedIn = await getStorage();
  const tempToken = await getStorage("tempToken");

  if (!config.headers) {
    config.headers = {};
  }

  if (!userLoggedIn?.token && config.url.includes("auth")) {
    config.headers.authorization = `Bearer ${tempToken}`;
  }

  if (userLoggedIn?.token && !config.url.includes("auth")) {
    config.headers.authorization = `Bearer ${userLoggedIn.token}`;
    config.headers[
      "x-offline-authorization"
    ] = `Bearer ${userLoggedIn.offlineToken}`;
  }

  config.headers["x-sdid-api-key"] = cfg.VITE_API_KEY;
  config.headers["x-sdid-api-secret-key"] = cfg.VITE_API_SECRET_KEY;

  config.headers["x-sdid-timestamp"] = new Date().getTime();
  config.headers["x-sdid-locale"] =
    Intl.DateTimeFormat().resolvedOptions().locale;

  try {
    const apiCall = await createAxiosInstance(
      config.url,
      config.isLocalServiceEnabled,
      config.isRemoteFetchForceEnabled
    );
    return await apiCall({
      ...config,
      ...formatConfig(config?.data || config.params),
    });
  } catch (err: any) {
    throw err;
  }
};

const formatConfig = (options: any) => {
  const filteredKeys = Object.keys(options || {}).filter((k) => options[k]);
  return filteredKeys.reduce((acc, k) => {
    acc[k] = options[k];
    return acc;
  }, {} as Record<string, any>);
};

export default api;
