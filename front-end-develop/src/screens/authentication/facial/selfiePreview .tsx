import Webcam from "react-webcam";
import { useEffect, useState } from "react";
import SelfieOverlay from "./selfieOverlay";
import SelfieFooter from "./selfieFooter";
import { useMFAFacialVerification } from "@/hooks/selfie/useLoginFacialVerification";
import toastMessage from "@/utils/common/toastMessage";
import SelectDropdown from "@/components/select";

interface Device {
  label: string;
  value: string;
}

export function SelfiePreview({
  webcamRef,
  handleSwitchMFAType,
  email,
  options,
  tempToken,
  type,
  isLoadingOTP,
  handleClose,
  imageCompare,
  address,
  handleSubmit,
  errors,
  isLocalServiceEnabled,
}: {
  webcamRef: any;
  handleSwitchMFAType: () => void;
  email: string;
  options?: any;
  tempToken: string;
  type?: string;
  isLoadingOTP: boolean;
  handleClose?: () => void;
  imageCompare: string;
  address?: any;
  handleSubmit: () => void;
  errors: any;
  isLocalServiceEnabled?: boolean;
}) {
  const { croppedImgSrc, orgimgSrc, status, capture, onReloadCamera } =
    useMFAFacialVerification(
      webcamRef,
      email,
      options,
      tempToken,
      type,
      imageCompare,
      address,
      isLocalServiceEnabled
    );

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<Device | undefined>(
    undefined
  );

  // Get available cameras
  useEffect(() => {
    const getCameras = async () => {
      try {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();

        const videoDevices = mediaDevices.filter(
          (device) => device.kind === "videoinput"
        );

        const listDevices: any = [];

        videoDevices.forEach((el) => {
          const device = {
            ...el,
            label: el.label,
            value: el.deviceId,
          };

          if (el.label.includes("AnkerWork")) {
            // put at the beginning
            listDevices.unshift(device);
          } else {
            // push normally
            listDevices.push(device);
          }
        });
        console.log({ listDevices });
        console.log("Cameras attached", listDevices);

        setDevices(listDevices);

        // Set the first camera as default if none is selected
        if (listDevices.length > 0) {
          setActiveDeviceId(listDevices[0]);
        }
      } catch (error) {
        console.error("Error listing cameras:", error);
        toastMessage("error", error);
      }
    };

    getCameras();
  }, []);

  const handleDeviceChange = (event: Device) => {
    setActiveDeviceId(event);
  };

  const videoConstraints = {
    width: 200,
    height: 200,
    // facingMode: "user",
    deviceId: activeDeviceId ? { exact: activeDeviceId.value } : undefined,
  };

  return (
    <>
      <div data-testid="selfieArea">
        <div>
          {croppedImgSrc ? (
            <div
              style={{
                width: 200,
                height: 200,
                borderRadius: 200,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <img
                className="selfieCaptured"
                src={croppedImgSrc}
                alt="Captured Selfie"
              />
              <SelfieOverlay
                status={{
                  ...status,
                }}
              />
            </div>
          ) : (
            <div>
              <SelectDropdown
                name="camera"
                options={devices}
                onChange={handleDeviceChange}
                value={activeDeviceId}
                type="object"
              />
              <center style={{ position: "relative" }}>
                <div
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 200,
                    overflow: "hidden",
                  }}
                >
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    width={200}
                    height={200}
                    screenshotFormat="image/jpeg"
                    videoConstraints={videoConstraints}
                    data-testid="webcam"
                  />
                </div>
              </center>
            </div>
          )}
        </div>
      </div>

      <div className="selfie-check-container">
        <SelfieFooter
          croppedImgSrc={croppedImgSrc}
          orgimgSrc={orgimgSrc}
          status={status}
          capture={capture}
          onReloadCamera={onReloadCamera}
          handleSwitchMFAType={handleSwitchMFAType}
          isLoadingOTP={isLoadingOTP}
          handleClose={handleClose}
          address={address}
          handleSubmit={handleSubmit}
          errors={errors}
        />
      </div>
    </>
  );
}

export default SelfiePreview;
