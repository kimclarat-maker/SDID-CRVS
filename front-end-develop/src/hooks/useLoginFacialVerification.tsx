import { mfaFacialVerification } from "@/api/selfie";
import { cropImage } from "@/utils/common/image/cropImage";
import toastMessage from "@/utils/common/toastMessage";
import { setStorage } from "@/utils/storage";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function useMFAFacialVerification(
  webcamRef: any,
  email: string,
  options: any,
  tempToken: string,
  type?: string
) {
  const [croppedImgSrc, setCroppedImage] = useState<string | null>(null);
  const [orgimgSrc, setOriginalImage] = useState<string | null>(null);
  const [status, setVerificationStatus] = useState({
    loading: false,
    verified: false,
    saving: false,
    failed: false,
  });
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<any>(0);

  const capture = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setVerificationStatus((prev) => ({ ...prev, loading: true }));
      setCroppedImage(imageSrc);
      setOriginalImage(imageSrc);
      await onVerify(imageSrc);
    }
  }, [webcamRef]);

  const onVerify = async (imageSrc: string) => {
    try {
      const data = await mfaFacialVerification(
        imageSrc,
        email,
        tempToken,
        type
      );

      setVerificationStatus((prev) => ({ ...prev, loading: false }));

      console.log("mfa facial login", data);

      if (options?.setOpenModal) {
        options.setOpenModal(false);
      }

      if (type === "renew-session") {
        return toastMessage("success", data.message);
      }

      await setStorage(data);

      navigate("/dashboard/admin");
    } catch (error) {
      setVerificationStatus((prev) => ({
        ...prev,
        loading: false,
        failed: true,
        verified: false,
      }));
    }
  };

  const onReloadCamera = () => {
    if (attempts === 2) {
      setAttempts(0);
    }
    setCroppedImage(null);
    setOriginalImage(null);
    setVerificationStatus((prev: any) => ({
      ...prev,
      loading: false,
      verified: false,
      failed: false,
    }));
  };

  return {
    croppedImgSrc,
    orgimgSrc,
    status,
    capture,
    onReloadCamera,
    attempts,
    onVerify,
  };
}
