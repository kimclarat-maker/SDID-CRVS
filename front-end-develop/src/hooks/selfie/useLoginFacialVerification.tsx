import { syncAccountData } from "@/api/accounts";
import {
  faceEmbedding,
  faceMatchProbability,
  mfaFacialVerification,
  verifyEmbedding,
} from "@/api/selfie";
import { LanguageContext } from "@/context/LanguageContext";
import { useLocalService } from "@/context/LocalServiceContext";
import { translations } from "@/internationalization";
import { defineAccess } from "@/utils/common/permissions";
import toastMessage from "@/utils/common/toastMessage";
import { setStorage } from "@/utils/storage";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export function useMFAFacialVerification(
  webcamRef: any,
  email: string,
  options: any,
  tempToken: string,
  type?: string,
  imageCompare?: string,
  address?: any,
  isLocalServiceEnabled?: boolean
) {
  const { translation } = useContext(LanguageContext);
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
  const { isLocalServiceActive: isLocalServiceInstalledAndActive } =
    useLocalService();
  const addressRef = useRef(address);

  useEffect(() => {
    addressRef.current = address;
  }, [address]);

  const capture = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setVerificationStatus((prev) => ({ ...prev, loading: true }));
      setCroppedImage(imageSrc);
      setOriginalImage(imageSrc);
      await onVerify(imageSrc, translation.default);
    }
  }, [webcamRef]);

  const onVerify = async (imageSrc: string, lng: string) => {
    try {
      if (!imageCompare)
        return normalFacialVerification(
          imageSrc,
          lng,
          addressRef.current
          // isLocalServiceEnabled
        );
      const { probability } = await faceMatchProbability({
        photoOne: imageSrc,
        photoTwo: imageCompare,
      });



      if (probability >= 0.9) {
        const { embedding } = await faceEmbedding({ image: imageCompare });

        if (embedding) {
          const verifyResponse = await verifyEmbedding({
            tempToken,
            embedding,
            email,
            address: addressRef.current,
            // isLocalServiceEnabled,
          });

          resultFacialVerification(
            { message: "Facial verification successful", data: verifyResponse },
            lng
          );
        }

        return;
      }

      normalFacialVerification(imageSrc, lng, addressRef.current);
    } catch (error: any) {
      normalFacialVerification(imageSrc, lng, addressRef.current);
    }
  };

  const normalFacialVerification = async (
    imageSrc: string,
    lng: string,
    address: any,
    isRemoteFetchForceEnabled?: boolean
  ) => {
    try {
      const data = await mfaFacialVerification(
        imageSrc,
        email,
        tempToken,
        type,
        address,
        isRemoteFetchForceEnabled
      );

      resultFacialVerification(data, lng);
    } catch (error: any) {
      setVerificationStatus((prev) => ({
        ...prev,
        loading: false,
        failed: true,
        verified: false,
      }));

      if (
        error?.response?.data?.message
          ?.toUpperCase()
          .includes("PHOTO DOES NOT MATCH")
      ) {
        return toastMessage("error", error);
      }

      toastMessage("error", error); // translations[lng].facial_instructions_error
    }
  };

  const resultFacialVerification = async (data: any, lng: string) => {
    try {
      setVerificationStatus((prev) => ({ ...prev, loading: false }));

      if (options?.setOpenModal) {
        options.setOpenModal(false);
      }

      if (type === "renew-session") {
        return toastMessage("success", data.message);
      }

      await setStorage(data.data || data);

      const canUseOffline = defineAccess({
        method: "get",
        module: "offline",
      });

      if (!canUseOffline && isLocalServiceEnabled) {
        await sessionStorage.clear();
        return toastMessage(
          "error",
          "You are not authorized for offline mode."
        );
      }

      if (isLocalServiceInstalledAndActive && isLocalServiceEnabled) {
        await syncAccountData(data?.data || data);
      }

      await navigate("/dashboard/admin/prenrollment/search");
    } catch (error: any) {
      setVerificationStatus((prev) => ({
        ...prev,
        loading: false,
        failed: true,
        verified: false,
      }));

      if (
        error?.response?.data?.message
          ?.toUpperCase()
          .includes("PHOTO DOES NOT MATCH")
      ) {
        return toastMessage("error", error);
      }

      toastMessage("error", translations[lng].facial_instructions_error);
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
