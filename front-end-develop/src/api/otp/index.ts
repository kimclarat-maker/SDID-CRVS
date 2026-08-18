import toastMessage from "@/utils/common/toastMessage";
import {
  SendOTPType,
  SkipVerificationCodeWithExisting,
  VerifyOTPType,
} from "@/types/OTP";
import api from "..";

export const sendOTP = async (params?: SendOTPType) => {
  const {
    type,
    preEnrollmentTempId,
    emailAddress,
    maskedPhoneNumberKey,
    legalGuardianId,
  } = params || {};
  try {
    if (!type) return toastMessage("error", "Send OTP missing field: type");
    const method = "POST";
    let url = "/requests/otp";
    let requestBody: any = {};

    if (type === "phone") {
      url += "/send-sms";
      requestBody = {
        maskedPhoneNumberKey,
      };
    }

    if (type === "email") {
      url += "/send-email";
      requestBody = {
        emailAddress,
      };
    }

    if (legalGuardianId) {
      requestBody.legalGuardianId = legalGuardianId;
    }

    if (preEnrollmentTempId) {
      requestBody.preEnrollmentTempId = preEnrollmentTempId;
    }

    const options = {
      method,
      url,
      data: requestBody,
    };

    const { data } = await api(options);
    return data;
  } catch (error) {
    toastMessage("error", error);

    throw error;
  }
};

export const verifyOTP = async (params?: VerifyOTPType) => {
  const {
    type,
    maskedPhoneNumberKey,
    preEnrollmentTempId,
    emailAddress,
    code,
  } = params || {};
  try {
    if (!type) return toastMessage("error", "Verify OTP missing field: type");
    const method = "POST";
    let url = "/requests/otp";
    let requestBody = {};

    if (type === "phone") {
      url += "/verify-sms";
      requestBody = {
        maskedPhoneNumberKey,
        preEnrollmentTempId,
      };
    }

    if (type === "email-verification") {
      url += "/verify-email";
      requestBody = {
        emailAddress,
      };
    }

    const options = {
      method,
      url,
      data: {
        ...requestBody,
        code: code + "",
      },
    };

    const { data } = await api(options);
    return data;
  } catch (error) {
    throw error;
  }
};

export const requestSelfieSkipVerificationCode = async (
  params?: SkipVerificationCodeWithExisting
) => {
  try {
    const method = "POST";
    let url = "/requests/selfie";

    const options = {
      method,
      url,
      data: params,
    };

    const { data } = await api(options);
    return data;
  } catch (error) {
    toastMessage("error", error);

    throw error;
  }
};

export const resumeBySelfieSkipCode = async (code: string) => {
  try {
    const method = "POST";
    let url = "/requests/skip-face-verification";

    const options = {
      method,
      url,
      data: {
        code,
      },
    };

    const { data } = await api(options);
    return data;
  } catch (error) {
    throw error;
  }
};

export const legalGuardianResumeBySelfieSkipCode = async (code: string) => {
  try {
    const method = "POST";
    let url = "/requests/legal-guardian/skip-selfie-verification";

    const options = {
      method,
      url,
      data: {
        selfieVerificationSkipCode: code,
      },
    };

    const { data } = await api(options);
    return data;
  } catch (error) {
    throw error;
  }
};
