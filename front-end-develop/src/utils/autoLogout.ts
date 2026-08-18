// utils/autoLogout.ts
export class AutoLogoutManager {
  private timeout: number;
  private warningTime: number;
  private onLogout: () => void;
  private onWarning?: (timeLeft: number) => void;
  private onShowModal?: () => void;
  private onHideModal?: () => void;

  private logoutTimer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private lastActivityKey = "ENROLLMENT_LAST_ACTIVITY";
  private isModalOpen = false;
  private isDestroyed = false; // Track destruction state

  constructor(
    timeout: number, // in minutes
    warningTime: number, // in minutes
    onLogout: () => void,
    onWarning?: (timeLeft: number) => void,
    onShowModal?: () => void,
    onHideModal?: () => void
  ) {
    this.timeout = timeout * 60 * 1000; // Convert to milliseconds
    this.warningTime = warningTime * 60 * 1000;
    this.onLogout = onLogout;
    this.onWarning = onWarning;
    this.onShowModal = onShowModal;
    this.onHideModal = onHideModal;

    this.initializeBroadcastChannel();
    this.setupActivityListeners();
    this.resetTimer();
  }

  private initializeBroadcastChannel() {
    if (typeof BroadcastChannel !== "undefined") {
      try {
        this.broadcastChannel = new BroadcastChannel("auto_logout_channel");

        this.broadcastChannel.onmessage = (event) => {
          if (this.isDestroyed) return; // Don't process messages if destroyed

          switch (event.data.type) {
            case "ACTIVITY_UPDATE":
              this.handleExternalActivity();
              break;
            case "LOGOUT":
              this.performLogout();
              break;
            case "MODAL_OPEN":
              this.isModalOpen = true;
              break;
            case "MODAL_CLOSE":
              this.isModalOpen = false;
              break;
          }
        };
      } catch (error) {
        console.warn("BroadcastChannel not supported:", error);
      }
    }
  }

  private setupActivityListeners() {
    // Track user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    // Store bound reference for proper removal
    this.boundHandleUserActivity = this.handleUserActivity.bind(this);
    this.boundHandleVisibilityChange = this.handleVisibilityChange.bind(this);

    events.forEach((event) => {
      document.addEventListener(event, this.boundHandleUserActivity, {
        passive: true,
      });
    });

    // Track visibility changes (tab switching)
    document.addEventListener(
      "visibilitychange",
      this.boundHandleVisibilityChange
    );
  }

  // Add these properties to store bound methods
  private boundHandleUserActivity: () => void = () => {};
  private boundHandleVisibilityChange: () => void = () => {};

  private handleUserActivity() {
    if (this.isDestroyed) return;

    const now = Date.now();

    // Update last activity in localStorage (shared across tabs)
    try {
      localStorage.setItem(this.lastActivityKey, now.toString());
    } catch (error) {
      console.warn("Failed to update localStorage:", error);
    }

    // Broadcast activity to other tabs
    this.broadcastActivity();

    // Reset timers
    this.resetTimer();
  }

  private handleExternalActivity() {
    if (this.isDestroyed) return;
    this.resetTimer();
  }

  private handleVisibilityChange() {
    if (this.isDestroyed) return;

    if (!document.hidden) {
      this.syncWithStorage();
    }
  }

  private syncWithStorage() {
    try {
      const lastActivity = localStorage.getItem(this.lastActivityKey);
      if (lastActivity) {
        const lastActivityTime = parseInt(lastActivity);
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivityTime;

        if (timeSinceLastActivity < this.timeout) {
          this.resetTimer();
        }
      }
    } catch (error) {
      console.warn("Failed to sync with storage:", error);
    }
  }

  private broadcastActivity() {
    if (this.broadcastChannel && !this.isDestroyed) {
      try {
        this.broadcastChannel.postMessage({
          type: "ACTIVITY_UPDATE",
          timestamp: Date.now(),
        });
      } catch (error) {
        console.warn("Failed to broadcast activity:", error);
        // Don't rethrow - this is a non-critical operation
      }
    }
  }

  private resetTimer() {
    if (this.isDestroyed) return;

    // Clear existing timers
    this.clearTimers();

    const now = Date.now();

    // Set warning timer
    this.warningTimer = setTimeout(() => {
      if (!this.isDestroyed) {
        this.showWarning();
      }
    }, this.timeout - this.warningTime);

    // Set logout timer
    this.logoutTimer = setTimeout(() => {
      if (!this.isDestroyed) {
        this.performLogout();
      }
    }, this.timeout);
  }

  private clearTimers() {
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  private showWarning() {
    if (this.isDestroyed) return;

    if (this.onShowModal && !this.isModalOpen) {
      this.isModalOpen = true;
      this.onShowModal();

      // Broadcast modal state
      if (this.broadcastChannel && !this.isDestroyed) {
        try {
          this.broadcastChannel.postMessage({ type: "MODAL_OPEN" });
        } catch (error) {
          console.warn("Failed to broadcast modal open:", error);
        }
      }
    }

    if (this.onWarning) {
      const timeLeft = Math.ceil(this.warningTime / (60 * 1000));
      this.onWarning(timeLeft);
    }
  }

  private performLogout() {
    if (this.isDestroyed) return;

    // Broadcast logout to all tabs
    if (this.broadcastChannel && !this.isDestroyed) {
      try {
        this.broadcastChannel.postMessage({ type: "LOGOUT" });
      } catch (error) {
        console.warn("Failed to broadcast logout:", error);
      }
    }

    this.onLogout();
  }

  public handleSuccessfulReauth() {
    if (this.isDestroyed) return;

    this.isModalOpen = false;

    // Broadcast modal close
    if (this.broadcastChannel && !this.isDestroyed) {
      try {
        this.broadcastChannel.postMessage({ type: "MODAL_CLOSE" });
      } catch (error) {
        console.warn("Failed to broadcast modal close:", error);
      }
    }

    if (this.onHideModal) {
      this.onHideModal();
    }

    this.handleUserActivity();
  }

  public handleManualLogout() {
    if (this.isDestroyed) return;
    this.performLogout();
  }

  public destroy() {
    // Mark as destroyed first to prevent any new operations
    this.isDestroyed = true;

    // Clear timers
    this.clearTimers();

    // Close broadcast channel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch (error) {
        console.warn("Error closing broadcast channel:", error);
      }
      this.broadcastChannel = null;
    }

    // Remove event listeners
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((event) => {
      document.removeEventListener(event, this.boundHandleUserActivity);
    });

    document.removeEventListener(
      "visibilitychange",
      this.boundHandleVisibilityChange
    );
  }
}
