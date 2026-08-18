import { useEffect, useState } from "react";

const LOCK_KEY = "ENROLLMENT_TAB_LOCK";

export const useSingleTabLock = () => {
  const [hasAccess, setHasAccess] = useState(false);
  const [currentTabId, setCurrentTabId] = useState<string>("");

  useEffect(() => {
    const tabId = Date.now().toString();
    setCurrentTabId(tabId);

    // Try to acquire lock if none exists
    const existing = localStorage.getItem(LOCK_KEY);
    if (!existing) {
      localStorage.setItem(LOCK_KEY, tabId);
      setHasAccess(true);
    } else if (existing === tabId) {
      setHasAccess(true);
    }

    // Listen for storage changes from other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === LOCK_KEY) {
        const newValue = e.newValue;
        if (newValue !== tabId) {
          // Another tab took the lock
          setHasAccess(false);
        } else {
          // This tab regained the lock
          setHasAccess(true);
        }
      }
    };

    window.addEventListener("storage", handleStorage);

    // Release lock when this tab closes
    const releaseLock = () => {
      const lockOwner = localStorage.getItem(LOCK_KEY);
      if (lockOwner === tabId) {
        localStorage.removeItem(LOCK_KEY);
      }
    };
    window.addEventListener("beforeunload", releaseLock);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("beforeunload", releaseLock);
      releaseLock();
    };
  }, []);

  // Function to restore access and close other tabs
  const restoreAccess = () => {
    if (currentTabId) {
      // Take the lock
      localStorage.setItem(LOCK_KEY, currentTabId);
      setHasAccess(true);

      // Broadcast to other tabs that they should close
      localStorage.setItem("CLOSE_OTHER_TABS", Date.now().toString());
    }
  };

  // Function to close current tab
  const closeCurrentTab = () => {
    // Release the lock if this tab has it
    const lockOwner = localStorage.getItem(LOCK_KEY);
    if (lockOwner === currentTabId) {
      localStorage.removeItem(LOCK_KEY);
    }

    // Try to close the tab
    try {
      window.close();

      // If window.close() doesn't work, redirect to about:blank or show message
      setTimeout(() => {
        // If still open after trying to close, show alert or redirect
        window.location.href = "about:blank";
      }, 100);
    } catch (error) {
      console.error("Error closing tab:", error);
      // Fallback: redirect to a blank page or previous page
      window.history.back();
    }
  };

  // Effect to listen for close commands
  useEffect(() => {
    const handleCloseCommand = (e: StorageEvent) => {
      if (e.key === "CLOSE_OTHER_TABS") {
        const lockOwner = localStorage.getItem(LOCK_KEY);
        if (lockOwner !== currentTabId && currentTabId) {
          // This tab is not the active one, so close it
          closeCurrentTab();
        }
      }
    };

    window.addEventListener("storage", handleCloseCommand);
    return () => {
      window.removeEventListener("storage", handleCloseCommand);
    };
  }, [currentTabId]);

  return { hasAccess, restoreAccess, closeCurrentTab };
};
