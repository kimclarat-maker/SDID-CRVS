import { apiHandler } from "@/api";
import { handleDownloadFile, handleUpload } from "@/api/media";
import {
  irisQualityChecker,
  qualityChecker,
  fingerprintQualityChecker,
} from "@/api/quality/checker";
import { base64ToBlob, guessName } from "@/utils/common/image/base64ToBlob";
import { defineAccess } from "@/utils/common/permissions";
import toastMessage from "@/utils/common/toastMessage";
import { getStorage } from "@/utils/storage";
import axios from "axios";
import { useCallback, useState } from "react";

export const useUploadMedia = () => {
  const [loadingUpload, setLoading] = useState(false);

  const handleUploadMedia = async (
    file: any,
    referenceType: string,
    referenceId: string,
    headers?: any
  ) => {
    setLoading(true);

    try {
      const resData = await handleUpload(
        file,
        referenceType,
        referenceId,
        headers
      );

      setLoading(false);

      toastMessage("success", resData?.message);

      return resData;
    } catch (error) {
      console.error("upload media error:", error);
      setLoading(false);

      toastMessage("error", error);
    }
  };

  return {
    loadingUpload,
    handleUploadMedia,
  };
};

export const useDownloadMedia = () => {
  const [downloading, setLoading] = useState(false);

  const handleDownloadMedia = async (fileName: string) => {
    setLoading(true);

    try {
      const response = await handleDownloadFile(fileName);

      console.log("=================download media===================");
      console.log(response);
      console.log("====================================");

      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch general analytics:", error);
      setLoading(false);
    }
  };

  return {
    downloading,
    handleDownloadMedia,
  };
};

export function useUploadBioData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);

  const uploadBioData = useCallback(
    async ({
      enableQualityChecker,
      base64Input,
      referenceType,
      referenceId,
      myHeaders,
      position,
      isStartedOnline,
    }: {
      base64Input: string;
      referenceType: string;
      referenceId: string;
      myHeaders?: any;
      enableQualityChecker: boolean;
      position?: string;
      isStartedOnline?: boolean;
    }) => {
      const canUseOffline = defineAccess({
        method: "get",
        module: "offline",
      });
      const endpoint = `${await apiHandler(
        undefined,
        "/media",
        undefined,
        canUseOffline
        // isStartedOnline ? true : canUseOffline
      )}/media`;

      setLoading(true);
      setError(null);
      try {
        const blob = base64ToBlob(base64Input, "application/octet-stream");
        const name = guessName(base64Input, "upload.bin");
        const userLoggedIn = await getStorage();

        const formData = new FormData();
        formData.append("file", blob, name);
        formData.append("referenceType", referenceType);
        formData.append("referenceId", referenceId);

        const res = await axios({
          url: endpoint,
          method: "POST",
          headers: {
            "content-type": "multipart/form-data",
            ...myHeaders,
            Authorization: `Bearer ${userLoggedIn.token}`,
            "x-offline-authorization": `Bearer ${userLoggedIn.offlineToken}`,
          },
          data: formData,
        });

        const data = await res.data;
        setResponse(data);

        let quality = null;

        if (enableQualityChecker && referenceType === "ENROLLMENT_FACE") {
          console.log("Quality checker enabled");
          quality = await qualityChecker(base64Input);
        }

        if (
          enableQualityChecker &&
          referenceType === "ENROLLMENT_IRIS" &&
          position
        ) {
          quality = await irisQualityChecker(
            base64Input.replace("data:image/png;base64,", ""),
            position
          );
        }

        if (
          enableQualityChecker &&
          referenceType === "ENROLLMENT_FINGERPRINT" &&
          position
        ) {
          quality = await fingerprintQualityChecker(
            base64Input.replace("data:image/bmp;base64,", ""),
            position
          );
        }

        return {
          ...data,
          qualityCheckedData: quality,
        };
      } catch (err: any) {
        console.log(err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { uploadBioData, loading, error, response };
}
