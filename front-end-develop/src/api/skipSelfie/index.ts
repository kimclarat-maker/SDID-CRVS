import { GETParameters, EnrollmentType } from "@/types/Enrollment";
import api from "..";
import { defineAccess } from "@/utils/common/permissions";

interface ApiResponse {
  data: EnrollmentType[];
  total: number;
}

export const fetchPrenrollmentSkipSelfie = async (
  params: GETParameters,
  isStartedOnline?: boolean
): Promise<ApiResponse | undefined> => {
  try {
    let updatedBody = { ...params };
    if (
      updatedBody.startDate === "" ||
      updatedBody.endDate === "" ||
      (updatedBody.search && updatedBody.search !== "") ||
      (updatedBody.preEnrollmentNumber &&
        updatedBody.preEnrollmentNumber !== "")
    ) {
      delete updatedBody.startDate;
      delete updatedBody.endDate;
    }
    const options = {
      method: "GET",
      url: `/pre-enrollment/search/all`,
      params: updatedBody,
      isRemoteFetchForceEnabled: isStartedOnline,
    };
    console.log("options", options);

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const fetchEnrollmentSkipSelfie = async (
  params: GETParameters
): Promise<ApiResponse | undefined> => {
  try {
    const options = {
      method: "GET",
      url: `/enrollment`,
      params,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const skipSelfie = async ({
  preEnrollmentId,
  phoneNumber,
  isApproved = false,
  isStartedOnline,
}: {
  preEnrollmentId: string;
  phoneNumber?: string;
  isApproved?: boolean;
  isStartedOnline?: boolean;
}) => {
  try {
    let body: any = {
      phoneNumber,
      preEnrollmentId,
      isApproved,
    };

    const options = {
      method: "POST",
      url: `/pre-enrollment/applicant-selfie/skip-action`,
      data: body,
      isRemoteFetchForceEnabled: isStartedOnline,
    };
    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const verifySkipSelfieCode = async (
  preEnrollmentId: string,
  skipVerificationCode: string,
  isStartedOnline?: boolean
) => {
  try {
    let body: any = {
      preEnrollmentId,
      skipVerificationCode,
    };

    const options = {
      method: "POST",
      url: `/pre-enrollment/verify/skip-code`,
      data: body,
      isRemoteFetchForceEnabled: isStartedOnline,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

//pair validator

export const pairValidatorSkipRequestCode = async (
  enrollmentId: string,
  accountId: string,
  approverSelfie: string,
  isBioRefresh?: boolean,
  isStartedOnline?: boolean
) => {
  try {
    let body: any = {
      enrollmentId,
      accountId,
      approverSelfie,
    };

    let url = isBioRefresh
      ? `/enrollment/refresh-pair-validate/selfie-skip`
      : `/enrollment/pair-validate/selfie-skip`;

    const canUseOffline = defineAccess({
      method: "get",
      module: "offline",
    });

    if (canUseOffline) {
      url = isBioRefresh
        ? `/enrollment/refresh-pair-validate/selfie-skip-direct`
        : `/enrollment/pair-validate/selfie-skip-direct`;
    }

    const options = {
      method: "POST",
      url,
      data: body,
      isRemoteFetchForceEnabled: isStartedOnline,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const pairValidatorSkipSelfie = async (
  enrollmentId: string,
  isApproved: boolean,
  isBioRefresh?: boolean,
  isStartedOnline?: boolean
) => {
  try {
    let body: any = {
      enrollmentId,
      isApproved,
    };

    console.log("isBioRefresh", isBioRefresh);

    const options = {
      method: "POST",
      url: isBioRefresh
        ? `/enrollment/refresh-pair-validate/selfie-skip-action`
        : `/enrollment/pair-validate/selfie-skip-action`,
      data: body,
      isRemoteFetchForceEnabled: isStartedOnline,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const pairValidatorVerifySkipSelfieCode = async (
  enrollmentId: string,
  skipVerificationCode: string,
  isBioRefresh?: boolean,
  isStartedOnline?: boolean
) => {
  try {
    let body: any = {
      enrollmentId,
      skipVerificationCode,
    };

    const options = {
      method: "POST",
      url: isBioRefresh
        ? `/enrollment/refresh-pair-validate/selfie-skip-verify`
        : `/enrollment/pair-validate/selfie-skip-verify`,
      data: body,
      isRemoteFetchForceEnabled: isStartedOnline,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const pairValidatorDirectSkipRequestCode = async (
  params: {
    enrollmentId: string;
    accountId: string;
    approverSelfie: string;
    isBioRefresh?: boolean;
  },
  isStartedOnline?: boolean
) => {
  try {
    let body: any = {
      ...params,
    };

    const options = {
      method: "POST",
      url: params.isBioRefresh
        ? `/enrollment/refresh-pair-validate/selfie-skip-direct`
        : `/enrollment/pair-validate/selfie-skip-direct`,
      data: body,
      isRemoteFetchForceEnabled: isStartedOnline,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};
