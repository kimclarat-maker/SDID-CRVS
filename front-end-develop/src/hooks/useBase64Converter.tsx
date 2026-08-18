import { useCallback, useState } from "react";

export const useBase64Converter = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  interface ConvertBase64ToFileResult {
    file: File | null;
    blob: Blob | null;
    success: boolean;
    error?: string;
  }

  type ConvertBase64ToFile = (
    base64String: string,
    fileName?: string
  ) => Promise<ConvertBase64ToFileResult>;

  const convertBase64ToFile: ConvertBase64ToFile = useCallback(
    async (base64String, fileName = "image") => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(base64String);
        const blob = await response.blob();

        const mimeType = base64String.split(";")[0].split(":")[1];
        const extension = mimeType.split("/")[1];

        const file = new File([blob], `${fileName}.${extension}`, {
          type: mimeType,
        });

        setLoading(false);
        return { file, blob, success: true };
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
        return { file: null, blob: null, success: false, error: err.message };
      }
    },
    []
  );

  return { convertBase64ToFile, loading, error };
};
