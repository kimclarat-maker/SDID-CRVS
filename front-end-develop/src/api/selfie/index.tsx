import api from "..";
import toastMessage from "@/utils/common/toastMessage";

const AI_LOCAL_SERVICE_API = "http://localhost:12213";

export const faceMatchProbability = async ({
  photoOne,
  photoTwo,
}: {
  photoOne: string;
  photoTwo: string;
}) => {
  try {
    let url = `${AI_LOCAL_SERVICE_API}/match-probability`;

    const options = {
      method: "POST",
      url,
      data: {
        image_1: photoOne,
        image_2: photoTwo,
      },
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const verifyEmbedding = async ({
  tempToken,
  embedding,
  email,
  address,
  isLocalServiceEnabled,
}: {
  tempToken: string;
  embedding: any;
  email: string;
  address: any;
  isLocalServiceEnabled?: boolean;
}) => {
  try {
    let url = `/auth/mfa/verify-embedding`;

    const options = {
      method: "POST",
      url,
      data: {
        embedding,
        tempToken,
        email,
        ...(address || {}),
      },
      isRemoteFetchForceEnabled: isLocalServiceEnabled ? false : true,
    };
    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const faceEmbedding = async ({ image }: { image: string }) => {
  try {
    let url = `${AI_LOCAL_SERVICE_API}/face-embedding`;

    const options = {
      method: "POST",
      url,
      data: {
        image,
      },
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const mfaFacialVerification = async (
  photo: any,
  email: string,
  tempToken: string,
  type?: string,
  address?: any,
  isLocalServiceEnabled?: boolean
) => {
  try {
    let url = `/auth/mfa/verify-face`;

    if (type === "renew-session") {
      url = "/auth/send-session-renew-code/face-verification";
    }
    const options = {
      method: "POST",
      url,
      data: {
        photo,
        email,
        tempToken,
        ...(address || {}),
      },
      isRemoteFetchForceEnabled: isLocalServiceEnabled ? false : true,
    };

    const { data } = await api(options);

    return data;
  } catch (error: any) {
    if (error?.response?.data?.message) {
      // const parse = JSON.parse(error.response.data.message);
      // parse?.isSessionActive && window.location.reload();
    } else {
      toastMessage("error", error);
    }
    throw error;
  }
};

export const applicantSelfieMatch = async ({
  image,
  preEnrollmentId,
  phoneNumber,
  skipSelfieVerification,
  isStartedOnline,
  isLocalServiceEnabled,
  embedding,
}: {
  image: any;
  preEnrollmentId: string;
  phoneNumber?: string;
  skipSelfieVerification?: boolean;
  isBioRefresh?: boolean;
  isStartedOnline?: boolean;
  isLocalServiceEnabled?: boolean;
  embedding?: any;
}) => {
  try {
    let body: any = {
      selfie: image,
      preEnrollmentId,
      phoneNumber,
      skipSelfieVerification,
      embedding,
    };

    const options: any = {
      method: "POST",
      url: `/pre-enrollment/search/applicant-selfie-match`,
      data: body,
      isRemoteFetchForceEnabled: isStartedOnline,
    };

    if (isLocalServiceEnabled) {
      options.isLocalServiceEnabled = false;
    }

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const applicantSelfieEmbedding = async ({
  image,
  preEnrollmentId,
  embedding,
}: {
  image: string;

  preEnrollmentId: string;
  embedding: any;
}) => {
  try {
    let url = `/pre-enrollment/search/applicant-selfie-match-embedding`;

    const options = {
      method: "POST",
      url,
      data: {
        image,
        preEnrollmentId,
        embedding,
      },
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const applicantSelfieWithoutMatch = async ({
  image,
  preEnrollmentId,
  phoneNumber,
  skipSelfieVerification,
}: {
  image: any;
  preEnrollmentId: string;
  phoneNumber?: string;
  skipSelfieVerification?: boolean;
  isBioRefresh?: boolean;
}) => {
  try {
    let body: any = {
      selfie: image,
      preEnrollmentId,
      phoneNumber,
      skipSelfieVerification,
    };

    const options = {
      method: "POST",
      url: `/pre-enrollment/search/applicant-selfie-without-face-verification`,
      data: body,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};
