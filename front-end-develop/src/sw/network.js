const CACHE_NAME = "network-monitor-v1";
const HEALTH_CHECK_URL = getHealthCheckUrl();
const CHECK_INTERVAL = 15000; // 15 seconds

// Helper function to get the correct health check URL
function getHealthCheckUrl() {
  try {
    const env = import.meta.env.VITE_NODE_ENV;
    if (!env) return "/api/health"; // Fallback URL

    const envVarName = `VITE_${env.toUpperCase()}_API`;
    const apiUrl = import.meta.env[envVarName];

    return apiUrl ? `${apiUrl}/health` : "/api/health";
  } catch (error) {
    console.error("Error getting health check URL:", error);
    return "/api/health"; // Fallback URL
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME));
});

// Persistent background checking
const performBackgroundCheck = async () => {
  try {
    const response = await fetch(HEALTH_CHECK_URL, {
      method: "HEAD",
      cache: "no-store",
    });
    broadcastNetworkStatus(response.ok);
  } catch {
    broadcastNetworkStatus(false);
  } finally {
    // Schedule next check regardless of result
    setTimeout(performBackgroundCheck, CHECK_INTERVAL);
  }
};

// Start background checks when activated
self.addEventListener("activate", (event) => {
  event.waitUntil(performBackgroundCheck());
});

self.addEventListener("fetch", (event) => {
  if (event.request.url.includes(HEALTH_CHECK_URL)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          broadcastNetworkStatus(true);
          return response;
        })
        .catch(() => {
          broadcastNetworkStatus(false);
          return new Response(null, { status: 503 });
        })
    );
  }
});

function broadcastNetworkStatus(isOnline) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: "NETWORK_STATUS",
        isOnline,
      });
    });
  });
}
