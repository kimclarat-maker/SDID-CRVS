import { translations } from "@/internationalization";

export function extractErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (!error) return "";
  console.log(typeof error === "object");

  // Handle AxiosError or similar structured errors
  if (typeof error === "object") {
    const err = error as Record<string, any>;

    console.log("err?.response?.data", error);

    if (err?.response?.data?.message?.includes("errorDescription")) {
      try {
        const errorDetails = JSON.parse(err.response.data.message);
        return errorDetails.errorDescription || "";
      } catch {
        return "An unexpected error occurred.";
      }
    }

    let errMessage = err?.response?.data?.message || err?.message || "";

    if (errMessage?.startsWith("API Error:")) {
      errMessage = errMessage.split("API Error:")[1]?.trim() || "";
    }
    return err?.response?.data?.message || err?.message || String(error);
  }

  return customErrorMessage(String(error));
}

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
  };

  let errMessage = translationMap[error] || error;

  if (errMessage?.startsWith("API Error:")) {
    errMessage = errMessage.split("API Error:")[1]?.trim() || "";
  }

  return errMessage;
}
