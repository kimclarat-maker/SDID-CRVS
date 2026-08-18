import toastMessage from "@/utils/common/toastMessage";
import api from "..";
import prenrollment from "@/mocks/prenrollment";

export const fetchPrenrollmentByIdentifier = async (
  identifier: string,
  refresh?: boolean
) => {
  try {
    const options = {
      method: "GET",
      url: `/pre-enrollment/search/${identifier}/identifier`,
      params: {
        refresh,
      },
    };

    const data = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const fetchPrenrollmentByPrenrollmentNumber = async (
  prenrollmentNo: string,
  refresh?: boolean,
  isStartedOnline?: boolean
) => {
  try {
    const options = {
      method: "GET",
      url: `/pre-enrollment/search/${prenrollmentNo}/pre-enrollment-no`,
      params: {
        refresh,
      },
      isRemoteFetchForceEnabled: isStartedOnline,
    };

    const data = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const fetchPrenrollmentByDemographics = async (params: any) => {
  try {
    const options = {
      method: "GET",
      url: `/pre-enrollment/search/demographics`,
      params,
    };

    const data = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const fetchPrenrollmentBySelfie = async (params: any) => {
  try {
    const options = {
      method: "GET",
      url: `/pre-enrollment/search/selfie/`,
      params,
    };

    const data = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};

export const fetchPrenrollmentById = async (id: string) => {
  try {
    // const options = {
    //   method: "GET",
    //   url: `/analytics/summary`,
    //   params
    // };

    // return await api(options);

    return prenrollment.find((el) => el._id === id);
  } catch (error) {
    toastMessage("error", error);
    return undefined;
  }
};

export const onManualCentralToOfflineSync = async (preEnrollmentNo: string) => {
  try {
    const options = {
      method: "POST",
      url: "/sync/central-to-offline/pre-enrollment",
      data: {
        preEnrollmentNo,
      },
    };

    await api(options);
  } catch (error) {
    toastMessage("error", `SYNC FAILED: ${error}`);
  }
};

export const onManualOfflineToCentralSync = async (
  preEnrollmentNumber: string
) => {
  try {
    const options = {
      method: "POST",
      url: "/sync/offline-to-central/pre-enrollment",
      data: {
        preEnrollmentNumber,
      },
    };

    await api(options);
  } catch (error) {
    toastMessage("error", `SYNC FAILED: ${error}`);
  }
};
