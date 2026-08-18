// public/sw/local.ts
const LOCAL_CHECK_INTERVAL = 5000; // 5 seconds
const LOCAL_SERVICE_URL = "https://localhost:12212/api/v1/health";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const checkLocalService = async () => {
  let attempt = 0;
  let success = false;

  while (attempt < MAX_RETRIES && !success) {
    try {
      const response = await fetch(LOCAL_SERVICE_URL, {
        method: "GET",
        cache: "no-store",
        mode: "cors",
      });

      if (response.ok) {
        success = true;
        broadcastStatus(true);
      }
    } catch (error) {
      attempt++;
      if (attempt >= MAX_RETRIES) {
        broadcastStatus(false);
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }

  setTimeout(checkLocalService, LOCAL_CHECK_INTERVAL);
};

const broadcastStatus = (isActive) => {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: "LOCAL_SERVICE_CHECK_STATUS",
        isOnline: isActive,
      });
    });
  });
};

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim().then(checkLocalService));
});
