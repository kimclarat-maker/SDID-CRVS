import { useState, useCallback } from "react";
import { SignatureState, defaultConfig } from "@/types/signatureTypes";

export const useSignatureState = (
  enableCapture: boolean,
  enrollmentData: any
) => {
  const [state, setState] = useState<SignatureState>({
    sigSDK: undefined,
    mSigObj: undefined,
    initSDKLoading: false,
    sdkInitialized: false,
    initLicenseLoading: false,
    licenseInitialized: false,
    capturing: false,
    sigImg: "",
    sigTxt: "",
    documentHash: undefined,
    who: "",
    why: "",
    devices: [],
    selectedDevice: undefined,
    config: defaultConfig,
    capDialog: undefined,
    isSubmitting: false,
    openSuccessModal: false,
    showSDModal: false,
    supportingDocuments: [],
    isSubmittingWithSD: false,
    comment: "",
    updatedComment: "",
    openCommentModal: false,
    supportsWebHID: false,
  });

  const updateState = useCallback((updates: Partial<SignatureState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Initialize enrollment data
  useState(() => {
    try {
      if (enrollmentData?.biometric?.signature) {
        const signatureData = enrollmentData.biometric.signature;
        updateState({
          supportingDocuments: signatureData.supportingDocuments || [],
          sigImg: signatureData.signature || "",
          comment: signatureData.comment || "",
        });
      }
    } catch (error) {
      console.error("Error parsing enrollment data:", error);
    }
  });

  // Initialize WebHID support
  useState(() => {
    if (!enableCapture) return;
    updateState({ supportsWebHID: "hid" in navigator });
  });

  return { state, updateState };
};
