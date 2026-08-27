import { BIO_AUDIT_API, BIO_AUDIT_API_KEY } from "@/constants/bioAudit";
import { base64ToBlob, guessName } from "@/utils/common/image/base64ToBlob";
import toastMessage from "@/utils/common/toastMessage";
import axios from "axios";
import { isDemoMode } from "@/demo/config";
import {
  demoQualityChecker,
  demoIrisQualityChecker,
  demoFingerprintQualityChecker,
} from "@/demo/services/deviceServices";

export const qualityChecker = async (base64Input: string) => {
  if (isDemoMode()) return demoQualityChecker();
  try {
    const blob = base64ToBlob(base64Input, "image/jpeg");
    const name = guessName(base64Input, "upload.bin");
    const headers = {
      "X-Api-Key": BIO_AUDIT_API_KEY,
    };

    const formData = new FormData();
    formData.append("file", blob, name);

    const res = await axios({
      url: `${BIO_AUDIT_API}/enroll`,
      method: "POST",
      headers,
      data: formData,
    });

    const text = await res.data;
    return text;
  } catch (error) {
    return null;
  }
};

export const irisQualityChecker = async (
  base64Input: string,
  position: string
) => {
  if (isDemoMode()) return demoIrisQualityChecker();
  try {
    const res = await axios({
      url: `${BIO_AUDIT_API}/iris/enroll`,
      method: "POST",
      headers: {
        "X-Api-Key": BIO_AUDIT_API_KEY,
      },
      data: {
        base64Image: base64Input,
        position,
        segment: true,
      },
    });

    const text = await res.data;
    return text;
  } catch (error) {
    toastMessage("error", error);
  }
};

export const fingerprintQualityChecker = async (
  base64Input: string,
  position: string
) => {
  if (isDemoMode()) return demoFingerprintQualityChecker();
  try {
    const res = await axios({
      url: `${BIO_AUDIT_API}/fingerprint/enroll`,
      method: "POST",
      headers: {
        "X-Api-Key": BIO_AUDIT_API_KEY,
      },
      data: {
        base64Image: base64Input,
        position,
        CalculateNfiq: true,
        CalculateNfiq2: true,
        CalculateNfiq21: false,
        DetectLiveness: false,
        LivenessConfidenceThreshold: 50,
        MaximalRotation: 15,
        QualityThreshold: 10,
        MinimalMinutiaCount: 0,
      },
    });

    const text = await res.data;
    return text;
  } catch (error) {
    console.log("error", error);
  }
};
