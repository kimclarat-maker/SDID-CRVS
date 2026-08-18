export interface GlobalConfig {
  VITE_API_BASE_URL?: string;
  VITE_NODE_ENV?: "development" | "production" | "test";
  VITE_API_KEY?: string;
  VITE_API_SECRET_KEY?: string;
  VITE_APP_NAME?: string;
  VITE_CLIENT?: string;
  VITE_DEVELOPMENT_API?: string;
  VITE_PRODUCTION_API?: string;
  VITE_TEST_API?: string;
  VITE_LOCAL_SERVICE_API?: string;
  VITE_LOCAL_SERVICE_TIMEOUT?: number;
  VITE_BIO_AUDIT_API_KEY?: string;
  VITE_PUBLIC_API?: string;
  VITE_OFFLINE_PACKAGE_DOWNLOAD_URL?: string;
}
