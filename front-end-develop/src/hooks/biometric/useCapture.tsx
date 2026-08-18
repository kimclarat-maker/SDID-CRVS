import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

export function useCapture(webcamRef: any) {
  const [image, setImage] = useState<string | null>(null);
  const [status, setVerificationStatus] = useState({
    loading: false,
    verified: false,
    saving: false,
    failed: false,
  });

  const capture = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setVerificationStatus((prev) => ({ ...prev, loading: true }));
      setImage(imageSrc);
    }
  }, [webcamRef]);

  const onReloadCamera = () => {
    setImage(null);
    setVerificationStatus((prev: any) => ({
      ...prev,
      loading: false,
      verified: false,
      failed: false,
    }));
  };

  return {
    image,
    status,
    capture,
    onReloadCamera,
  };
}
