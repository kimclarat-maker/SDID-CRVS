import { GlobalConfig } from "@/types/GlobalConfig";

const env: GlobalConfig =
  (typeof window !== "undefined" && window.________ENV__) ||
  ({} as GlobalConfig);

const VITE_NODE_ENV =
  import.meta.env?.["VITE_NODE_ENV"] || env.VITE_NODE_ENV || "development";

const VITE_API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL ||
  env?.VITE_API_BASE_URL ||
  (import.meta.env as any)?.[`VITE_${VITE_NODE_ENV}_API`?.toUpperCase()] ||
  (env as any)?.[`VITE_${VITE_NODE_ENV}_API`?.toUpperCase()] ||
  "";

const VITE_API_KEY =
  import.meta.env?.["VITE_API_KEY"] || env.VITE_API_KEY || "";

const VITE_API_SECRET_KEY =
  import.meta.env?.["VITE_API_SECRET_KEY"] || env.VITE_API_SECRET_KEY || "";

const VITE_APP_NAME =
  import.meta.env?.["VITE_APP_NAME"] || env.VITE_APP_NAME || "SDID-ENROLLMENT";

const VITE_CLIENT = import.meta.env?.["VITE_CLIENT"] || env.VITE_CLIENT || "";

const VITE_DEVELOPMENT_API =
  import.meta.env?.["VITE_DEVELOPMENT_API"] || env.VITE_DEVELOPMENT_API || "";

const VITE_PRODUCTION_API =
  import.meta.env?.["VITE_PRODUCTION_API"] || env.VITE_PRODUCTION_API || "";

const VITE_TEST_API =
  import.meta.env?.["VITE_TEST_API"] || env.VITE_TEST_API || "";

const VITE_LOCAL_SERVICE_API =
  import.meta.env?.["VITE_LOCAL_SERVICE_API"] ||
  env.VITE_LOCAL_SERVICE_API ||
  "";

const VITE_LOCAL_SERVICE_TIMEOUT =
  import.meta.env?.["VITE_LOCAL_SERVICE_TIMEOUT"] ||
  env.VITE_LOCAL_SERVICE_TIMEOUT ||
  10000;

const VITE_BIO_AUDIT_API_KEY =
  import.meta.env?.["VITE_BIO_AUDIT_API_KEY"] ||
  env.VITE_BIO_AUDIT_API_KEY ||
  "";

const VITE_PUBLIC_API =
  import.meta.env?.["VITE_PUBLIC_API"] || env.VITE_PUBLIC_API || "";

const VITE_OFFLINE_PACKAGE_DOWNLOAD_URL =
  import.meta.env?.["VITE_OFFLINE_PACKAGE_DOWNLOAD_URL"] ||
  env.VITE_OFFLINE_PACKAGE_DOWNLOAD_URL ||
  "";

export const cfg: GlobalConfig = {
  VITE_API_BASE_URL,
  VITE_NODE_ENV,
  VITE_API_KEY,
  VITE_API_SECRET_KEY,
  VITE_APP_NAME,
  VITE_CLIENT,
  VITE_DEVELOPMENT_API,
  VITE_PRODUCTION_API,
  VITE_TEST_API,
  VITE_LOCAL_SERVICE_API,
  VITE_LOCAL_SERVICE_TIMEOUT,
  VITE_BIO_AUDIT_API_KEY,
  VITE_PUBLIC_API,
  VITE_OFFLINE_PACKAGE_DOWNLOAD_URL,
};
