import { useState } from "react";
import toastMessage from "@/utils/common/toastMessage";
import api from "@/api";

const useDeleteFile = () => {
  const [deleting, setLoader] = useState(false);
  const [index, setIndex] = useState<number | null>(null);

  const deleteFile = async ({
    referenceType,
    referenceId,
    mediaId,
    index,
  }: {
    referenceType: string;
    referenceId: any;
    mediaId: string;
    index: any;
  }) => {
    index !== undefined && setIndex(index);

    try {
      setLoader(true);

      const options = {
        url: `/media`,
        method: "DELETE",
        data: {
          referenceType,
          referenceId,
          mediaId,
        },
      };
      // Fetch the file
      const response = await api(options);

      toastMessage("success", response.data.message);

      setLoader(false);
    } catch (error: any) {
      toastMessage(
        "error",
        error.message || "An error occurred while deleting the file"
      );
      setLoader(false);
      return null;
    }
  };

  return {
    deleteFile,
    deleting,
    deleteIndex: index,
  };
};

export default useDeleteFile;
