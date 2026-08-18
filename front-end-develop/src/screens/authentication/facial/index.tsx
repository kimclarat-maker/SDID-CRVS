import { AccountType } from "@/types/Account";
import SelfiePreview from "./selfiePreview ";
import { useRef } from "react";
import Webcam from "react-webcam";

function FacialVerification({
  handleSwitchMFAType,
  email,
  setOpenModal,
  getStarted,
  tempToken,
  type,
  isLoadingOTP,
  handleClose,
  userInfo,
  address,
  handleSubmit,
  errors,
  isLocalServiceEnabled,
}: {
  handleSwitchMFAType: () => void;
  email: string;
  setOpenModal?: (b: boolean) => void;
  others?: any;
  isRenewSession?: boolean;
  openModal?: boolean;
  getStarted?: boolean;
  tempToken: string;
  type?: string;
  isLoadingOTP: boolean;
  handleClose: () => void;
  userInfo: AccountType;
  address: any;
  handleSubmit: any;
  errors: any;
  isLocalServiceEnabled?: boolean;
}) {
  const webcamRef = useRef<Webcam>(null);

  return (
    <div
      className="selfieContainer"
      style={{
        backgroundColor: "var(--bg-color)",
        position: "relative",
        bottom: 0,
        top: 0,
        height: "100%",
      }}
    >
      <div data-testid="webcam-preview">
        <SelfiePreview
          webcamRef={webcamRef}
          handleSwitchMFAType={handleSwitchMFAType}
          email={email}
          tempToken={tempToken}
          options={{
            isRenewSession: true,
            setOpenModal: setOpenModal,
            getStarted,
          }}
          type={type}
          isLoadingOTP={isLoadingOTP}
          // handleClose={handleClose}
          imageCompare={userInfo.image}
          address={address}
          handleSubmit={handleSubmit}
          errors={errors}
          isLocalServiceEnabled={isLocalServiceEnabled}
        />
      </div>
    </div>
  );
}

export default FacialVerification;
