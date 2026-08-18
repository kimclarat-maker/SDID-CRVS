let lastActivity = Date.now();
const INACTIVITY_LIMIT = 10 * 60 * 1000;

function updateActivity() {
  lastActivity = Date.now();
}

function broadcast(msg) {
  self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
    clients.forEach((client) => client.postMessage(msg));
  });
}

// 🔹 Check inactivity every 15s
setInterval(() => {
  const now = Date.now();
  if (now - lastActivity >= INACTIVITY_LIMIT) {
    broadcast({ type: "LOGOUT" });
    lastActivity = now; // reset so it doesn’t keep firing every 15s
  }
}, 15 * 1000);

// 🔹 Install
self.addEventListener("install", () => {
  console.log("[SW] Installed");
  self.skipWaiting();
});

// 🔹 Activate
self.addEventListener("activate", (event) => {
  console.log("[SW] Activated");
  event.waitUntil(self.clients.claim());
  updateActivity();
});

// 🔹 Listen for activity from client
self.addEventListener("message", (event) => {
  if (event.data?.type === "USER_ACTIVITY") {
    updateActivity();
  }
});

// 🔹 Extra safety: network fetch counts as activity
self.addEventListener("fetch", () => {
  updateActivity();
});
