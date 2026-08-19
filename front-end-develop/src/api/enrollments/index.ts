import toastMessage from "@/utils/common/toastMessage";
import { GETParameters, EnrollmentType } from "@/types/Enrollment";
import api from "..";
import enrollments from "@/mocks/enrollments";
import { isDemoMode } from "@/demo/config";
import {
  demoListApplications,
  demoGetApplicationById,
} from "@/demo/services/applications";

interface ApiResponse {
  data: EnrollmentType[];
  total: number;
}

export const fetchEnrollments = async (
  params: GETParameters,
  type?: string
): Promise<ApiResponse | undefined> => {
  if (isDemoMode())
    return demoListApplications({
      ...params,
      status: type === "OFFLINE" ? "OFFLINE" : (params as any).status,
    } as any);

  if (params.search === "" || params.search === undefined) {
    delete params.search;
  } else {
    delete params.startDate;
    delete params.endDate;
  }

  if (params.startDate === "" || params.startDate === undefined) {
    delete params.startDate;
  }

  if (params.endDate === "" || params.endDate === undefined) {
    delete params.endDate;
  }

  try {
    let url = `enrollment`;

    console.log({ type });

    if (type === "OFFLINE") {
      url = `enrollment/offline`;
    }

    console.log({ type });

    const options = {
      method: "GET",
      url,
      params
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const fetchEnrollmentById = async (
  id: string,
  isStartedOnline?: boolean
) => {
  if (isDemoMode()) return demoGetApplicationById(id);

  try {
    const options = {
      method: "GET",
      url: `/enrollment/${id}`,
      isRemoteFetchForceEnabled: isStartedOnline
    };

    return await api(options);
  } catch (error) {
    toastMessage("error", error);
    return undefined;
  }
};

export const fetchEnrollmentByIdetntifier = async (identifier: string) => {
  try {
    return {
      data: enrollments.find((el) => el.identifier === identifier),
      total: 10
    };
  } catch (error) {
    throw error;
  }
};

// ENROLLMENT PROCESS

export const onStart = async ({
  preEnrollmentId,
  isBioRefresh,
  payload,
  bioToken,
  isStartedOnline
}: {
  preEnrollmentId?: string;
  isBioRefresh?: boolean;
  payload?: any;
  bioToken?: string;
  isStartedOnline?: boolean;
}) => {
  try {
    const options = {
      method: "POST",
      url: isBioRefresh
        ? `/enrollment/start-refresh`
        : `/enrollment/start/${preEnrollmentId}`,
      data: payload,
      headers: {
        bioToken
      },
      isRemoteFetchForceEnabled: isStartedOnline
    };

    console.log("options", options);

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const onAddIRIS = async (
  payload: {
    enrollmentId: string;
    leftIris: any;
    rightIris: any;
    supportingDocuments: string[];
  },
  isBioRefresh: boolean,
  bioToken?: string,
  isStartedOnline?: boolean
) => {
  try {
    const options = {
      method: "POST",
      url: isBioRefresh ? `/enrollment/refresh-iris` : `/enrollment/add-iris`,
      data: payload,
      headers: {
        bioToken
      },
      isRemoteFetchForceEnabled: isStartedOnline
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export interface FINGERPINTTYPE {
  leftThumb: string;
  leftIndex: string;
  leftMiddle: string;
  leftRing: string;
  leftLittle: string;
  rightThumb: string;
  rightIndex: string;
  rightMiddle: string;
  rightRing: string;
  rightLittle: string;
  supportingDocuments: string[];
  preview: string;
}

export const onAddFingerprint = async (
  enrollmentId: string,
  payload: {
    leftThumb: string | null;
    leftIndex: string | null;
    leftMiddle: string | null;
    leftRing: string | null;
    leftLittle: string | null;
    rightThumb: string | null;
    rightIndex: string | null;
    rightMiddle: string | null;
    rightRing: string | null;
    rightLittle: string | null;
    supportingDocuments?: string[] | null;
    thumbs?: string | null;
    leftFingers?: string | null;
    rightFingers?: string | null;
    preview?: string | null;
  },
  isBioRefresh: boolean,
  bioToken?: string,
  isStartedOnline?: boolean
) => {
  try {
    const options = {
      method: "POST",
      url: isBioRefresh
        ? `/enrollment/refresh-fingerprint`
        : `/enrollment/add-fingerprint`,
      data: {
        ...payload,
        enrollmentId
      },
      headers: {
        bioToken
      },
      isRemoteFetchForceEnabled: isStartedOnline
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const onAddSignature = async (
  payload: {
    enrollmentId: string;
    signature?: string;
    supportingDocuments?: any;
    bioRefreshToken?: string;
    preview?: string;
    deviceSerialNumber?: string;
    comment?: string;
  },
  isBioRefresh: boolean,
  bioToken?: string
) => {
  try {
    const options = {
      method: "POST",
      url: isBioRefresh
        ? `/enrollment/refresh-signature`
        : `/enrollment/add-signature`,
      data: payload,
      headers: {
        bioToken
      }
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const onAddSelfie = async (
  payload: {
    enrollmentId: string;
    face: any;
    supportingDocuments: string[];
    bioRefreshToken?: string;
    deviceSerialNumber: string;
    comment: string;
    preview: any;
  },
  isBioRefresh: boolean,
  bioToken?: string,
  isStartedOnline?: boolean
) => {
  try {
    const options = {
      method: "POST",
      url: isBioRefresh ? `/enrollment/refresh-face` : `/enrollment/add-selfie`,
      data: payload,
      headers: {
        bioToken
      },
      isRemoteFetchForceEnabled: isStartedOnline
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const onMatchFacialForPairValidator = async (
  payload: {
    enrollmentId: string;
    accountId: string;
    approverSelfie: string;
  },
  isBioRefresh?: boolean,
  isStartedOnline?: boolean
) => {
  try {
    const options = {
      method: "POST",
      url: isBioRefresh
        ? `/enrollment/refresh-pair-validate`
        : `/enrollment/pair-validate`,
      data: payload,
      isRemoteFetchForceEnabled: isStartedOnline
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const onSubmitEnrollment = async (
  enrollmentId: string,
  isBioRefresh?: boolean,
  isStartedOnline?: boolean
) => {
  try {
    const options = {
      method: "POST",
      url: isBioRefresh
        ? `/enrollment/refresh-submit/${enrollmentId}`
        : `/enrollment/submit/${enrollmentId}`,
      isRemoteFetchForceEnabled: isStartedOnline
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const fetchBioRefreshHistory = async (enrollmentId: string) => {
  try {
    const options = {
      method: "GET",
      url: `/enrollment/biometric-history/${enrollmentId}`
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const assignOfficer = async (
  enrollmentId: string,
  accountId: string
) => {
  try {
    const options = {
      method: "PATCH",
      url: `/enrollment/${enrollmentId}/reassign`,
      data: { accountId }
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const deleteData = async (enrollmentId: string) => {
  try {
    const options = {
      method: "DELETE",
      url: `/enrollment/${enrollmentId}`
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const fetchBiometricById = async (params: any) => {
  try {
    const options = {
      method: "GET",
      url: `/enrollment/biometrics`,
      params
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const manualSyncApiHandler = async () => {
  try {
    const options = {
      method: "POST",
      url: `/v1/sync/central-to-offline/media`
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const pushToSdidCore = async (enrollmentId: string) => {
  try {
    const options = {
      method: "POST",
      url: `/sdid-core/enrollments/${enrollmentId}/send`
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const pushBiometricRefreshToCore = async (enrollmentId: string) => {
  try {
    const options = {
      method: "POST",
      url: `/sdid-core/enrollments/${enrollmentId}/biometric-refresh`
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const enrollmentRollback = async (payload: {
  enrollmentId: string;
  rollbackReason: string;
}) => {
  try {
    const options = {
      method: "POST",
      url: `/enrollment/rollback`,
      data: payload
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};
