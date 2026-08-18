import { mapBackendErrors } from "@/constants/map-backend-errors";
import { translations } from "@/internationalization";
import toast from "react-hot-toast";

type MessageType = "error" | "success" | "info" | "warning";

const EXCLUDED_MESSAGES = [
  "UNAUTHORIZED",
  "SESSION",
  "UNKNOWN ERROR",
  "SESSION EXPIRED",
  "NETWORK ERROR",
  "ECONNREFUSED",
  "ALL HOST(S) TRIED FOR QUERY FAILED",
  "THE OPERATION DID NOT COMPLETE SUCCESSFULLY",
];

// Track currently displayed toast IDs
const activeToastIds = new Set<string>();

export default function toastMessage(
  type: MessageType = "error",
  error?: unknown,
  duration: number = 5000
): void {
  try {
    let errorMessage = extractErrorMessage(error);

    // Customize the error message
    errorMessage = customErrorMessage(errorMessage);

    // Exclude certain messages from being displayed
    if (
      EXCLUDED_MESSAGES.some((msg) =>
        errorMessage?.toUpperCase().includes(msg?.toUpperCase())
      )
    ) {
      return;
    }

    // Check if this message is already being displayed
    if (isMessageAlreadyDisplayed(errorMessage)) {
      return;
    }

    const toastId = showToast(type, errorMessage, duration);

    // Store the toast ID for later cleanup
    if (toastId) {
      activeToastIds.add(toastId);
    }
  } catch (error) {
    console.error("Error in toastMessage:", error);
  }
}

// Helper function to extract error message
function extractErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (!error) return "";

  // Handle AxiosError or similar structured errors
  if (typeof error === "object") {
    const err = error as Record<string, any>;

    if (err?.response?.data?.message?.includes("errorDescription")) {
      try {
        const errorDetails = JSON.parse(err.response.data.message);
        return errorDetails.errorDescription || "";
      } catch {
        // return "An unexpected error occurred.";
      }
    }
    const messageField = err?.response?.data?.message || err?.message;
    if (typeof messageField === "string") return messageField;
    if (Array.isArray(messageField)) return messageField.join(", ");

    return messageField || "";
  }

  return String(error);
}

// Helper function to show the appropriate toast
function showToast(
  type: MessageType,
  message: string,
  duration: number
): string | undefined {
  const baseConfig = {
    position: "top-center" as const,
    duration,
    onClose: (toastId: string) => {
      // Cleanup when toast closes
      activeToastIds.delete(toastId);
    },
  };

  switch (type) {
    case "error":
      return toast.error(message, {
        ...baseConfig,
        style: {
          background: "var(--status-danger-bg)",
          color: "var(--status-danger)",
          border: "1px solid var(--status-danger-bg)",
        },
      });
    case "success":
      return toast.success(message, {
        ...baseConfig,
        style: {
          background: "var(--status-success-bg)",
          color: "var(--status-success)",
          border: "1px solid var(--status-success-bg)",
        },
      });
    case "warning":
      return toast(message, {
        ...baseConfig,
        icon: "⚠️",
        style: {
          background: "var(--status-warning-bg)",
          color: "var(--status-warning)",
          border: "1px solid var(--status-warning-bg)",
        },
      });
    default:
      return toast(message, {
        ...baseConfig,
        style: {
          background: "var(--status-info-bg)",
          color: "var(--status-info)",
          border: "1px solid var(--status-info-bg)",
        },
      });
  }
}

// Check if message is already displayed
function isMessageAlreadyDisplayed(message: string): boolean {
  return Array.from(activeToastIds).some((id) => {
    const toastElement = document.querySelector(`[data-toast-id="${id}"]`);
    return toastElement?.textContent?.includes(message);
  });
}

// Custom error messages
function customErrorMessage(error: string): string {
  if (!error) return "";

  const lng = (sessionStorage.getItem("language") || "english").replace(
    /^"|"$/g,
    ""
  );
  const translationMap: Record<string, string> = {
    "Request already exists with SKIP_SELFIE_APPROVED status":
      translations[lng]?.request_exist_with_SKIP_SELFIE_APPROVED,
    "Request already exists with pending review":
      translations[lng]?.request_exist_with_PENDING_REVIEW,
    "Pre enrollment number already generated for this request":
      translations[lng]?.pre_enrollment_already_generated_for_this_request,
    "No data found": translations[lng]?.no_data_found,
  };

  if (translationMap[error]) return translationMap[error];

  if (mapBackendErrors[lng]) {
    return mapBackendErrors[lng][error] || error;
  }

  return error;
}

// Cleanup function to dismiss all toasts
export function cleanupToasts(): void {
  activeToastIds.forEach((id) => {
    toast.dismiss(id);
  });
  activeToastIds.clear();
}
