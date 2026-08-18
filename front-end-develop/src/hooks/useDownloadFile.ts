import { useState } from "react";
import toastMessage from "@/utils/common/toastMessage";
import { getStorage } from "@/utils/storage";
import { cfg } from "@/constants/cfg";

const useDownloadFile = () => {
  const [loading, setLoader] = useState(false);
  const [index, setIndex] = useState<number | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  const fetchFile = async (url: string, index?: number) => {
    const user = await getStorage();
    index !== undefined && setIndex(index);

    try {
      setLoader(true);

      let headers: any = {
        Authorization: `Bearer ${user.token}`
      };

      if (cfg.VITE_API_KEY) {
        headers["x-sdid-api-key"] = cfg.VITE_API_KEY;
      }

      if (cfg.VITE_API_SECRET_KEY) {
        headers["x-sdid-api-secret-key"] = cfg.VITE_API_SECRET_KEY;
      }

      // Fetch the file
      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const blob = await response.blob();

      // Generate a URL for previewing the file
      const previewUrl = URL.createObjectURL(blob);

      setFilePreviewUrl(previewUrl);
      setLoader(false);

      return previewUrl;
    } catch (error: any) {
      toastMessage(
        "error",
        error.message || "An error occurred while fetching the file"
      );
      setLoader(false);
      return null;
    }
  };

  return {
    fetchFile,
    loading,
    index,
    filePreviewUrl
  };
};

export default useDownloadFile;
