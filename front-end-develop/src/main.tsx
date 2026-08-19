// import "material-symbols";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { LocalServiceProvider } from "./context/LocalServiceContext";
import { seedMockSession } from "./mockSession";

seedMockSession();

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <LocalServiceProvider>
      <App />
    </LocalServiceProvider>
  );
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/lock.js", { scope: "/" })
      .then((reg) => {
        console.log("✅ Service Worker registered:", reg);

        // Reload only if first install
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          newWorker?.addEventListener("statechange", () => {
            if (
              newWorker.state === "activated" &&
              !navigator.serviceWorker.controller
            ) {
              console.log("🔄 Reloading once so SW takes control...");
              window.location.reload();
            }
          });
        });
      })
      .catch((err) => {
        console.error("❌ Service Worker registration failed:", err);
      });

    // Listen for messages
    navigator.serviceWorker.addEventListener("message", (event) => {
      console.log("📩 Message from SW:", event.data);
      const data = JSON.parse(
        sessionStorage.getItem("SDID-ENROLLMENT") || "{}"
      );

      if (event.data?.type === "LOGOUT" && data.token) {
        sessionStorage.removeItem("SDID-ENROLLMENT");
        window.location.href = "/authentication/login";
      }
    });
  });
}

function notifyActivity() {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: "USER_ACTIVITY" });
  }
}

["click", "keydown", "mousemove", "scroll", "touchstart"].forEach((evt) =>
  window.addEventListener(evt, notifyActivity)
);

notifyActivity();
