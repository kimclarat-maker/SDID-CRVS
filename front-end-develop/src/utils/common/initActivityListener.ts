// initActivityListener.ts
export function initActivityListener() {
  console.log("[ACTIVITY] Initializing activity listener...");

  let lastActivityTime = 0;
  const ACTIVITY_THROTTLE = 1000; // Only send activity once per second

  const sendActivity = () => {
    const now = Date.now();
    if (now - lastActivityTime > ACTIVITY_THROTTLE) {
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "USER_ACTIVITY",
          timestamp: now,
        });
        console.log("[ACTIVITY] Sent activity to SW");
      } else {
        console.warn("[ACTIVITY] No SW controller available");
      }
      lastActivityTime = now;
    }
  };

  // Comprehensive list of user interaction events
  const userEvents = [
    "mousedown",
    "mouseup",
    "click",
    "dblclick",
    "contextmenu",
    "keydown",
    "keyup",
    "keypress",
    "touchstart",
    "touchend",
    "touchmove",
    "touchcancel",
    "scroll",
    "wheel",
    "focus",
    "blur",
    "input",
    "change",
    "drag",
    "dragstart",
    "dragend",
    "drop",
  ];

  // Add passive event listeners
  userEvents.forEach((eventName) => {
    document.addEventListener(eventName, sendActivity, {
      passive: true,
      capture: true,
    });
  });

  // Also listen on window for scroll/resize
  window.addEventListener("scroll", sendActivity, { passive: true });
  window.addEventListener("resize", sendActivity, { passive: true });

  // Send initial activity
  setTimeout(sendActivity, 1000);

  console.log(
    `[ACTIVITY] Activity listener initialized with ${
      userEvents.length + 2
    } events`
  );
}
