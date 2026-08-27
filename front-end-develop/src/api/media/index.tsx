import { getStorage } from "@/utils/storage";
import api from "..";
import { isDemoMode } from "@/demo/config";
import {
  demoHandleUpload,
  demoHandleDownloadFile,
  demoFetchSelfie,
  demoGetMediaById,
} from "@/demo/services/media";

export const handleUpload = async (
  file: any,
  referenceType?: string,
  referenceId?: string,
  headers?: any
) => {
  if (isDemoMode()) return demoHandleUpload(file);
  try {
    const userLoggedIn = await getStorage();
    const options = {
      url: `/media`,
      method: "POST",
      data: {
        file,
        referenceType,
        referenceId,
      },
      headers: headers || {
        "content-type": "multipart/form-data",
        Authorization: `Bearer ${userLoggedIn.token}`,
        "x-offline-authorization": `Bearer ${userLoggedIn.offlineToken}`,
      },
    };

    const response = await api(options);

    return response.data;
  } catch (error) {
    console.log("Error upload field", error);
    throw error;
  }
};
export const handleDownloadFile = async (fileName: string) => {
  if (isDemoMode()) return demoHandleDownloadFile(fileName);
  try {
    const options = {
      url: `/media`,
      method: "GET",
      data: {
        fileName,
      },
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    console.log("Error download file", error);
    throw error;
  }
};

export const fetchSelfie = async (selfieId: string) => {
  if (isDemoMode()) return demoFetchSelfie(selfieId);
  try {
    const options = {
      url: `/media/${selfieId}`,
      method: "GET",
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    console.log("Error view selfie", error);
    throw error;
  }
};

export const getMediaById = async ({ mediaId }: { mediaId: string }) => {
  if (isDemoMode()) return demoGetMediaById({ mediaId });
  try {
    const face = await api({
      url: `/media/${mediaId}`,
      method: "get",
      responseType: "arraybuffer", // Important for binary data
    } as any);

    // Convert ArrayBuffer to base64
    const uint8Array = new Uint8Array(face.data);
    const binaryString = uint8Array.reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ""
    );
    const base64Image = btoa(binaryString);
    const dataUrl = `${base64Image}`;
    return dataUrl;
  } catch (error) {
    throw error;
  }
};
