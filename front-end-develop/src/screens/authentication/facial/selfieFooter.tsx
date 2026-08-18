import Button from "@/components/button";
import { LanguageContext } from "@/context/LanguageContext";
import { useContext } from "react";

type FooterType = {
  orgimgSrc?: string | null;
  croppedImgSrc?: string | null;
  status?: {
    loading: boolean;
    verified?: boolean;
    saving?: boolean;
    failed?: boolean;
  };
  capture: () => void;
  onReloadCamera: () => void;
  attempts?: any;
  disabled?: boolean;
  handleSwitchMFAType: () => void;
  isLoadingOTP: boolean;
  handleClose?: () => void;
  address?: any;
  handleSubmit: () => void;
  errors: any;
};

function SelfieFooter({
  croppedImgSrc,
  status,
  capture,
  onReloadCamera,
  disabled,
  handleSwitchMFAType,
  isLoadingOTP,
  handleClose,
  address,
  handleSubmit,
  errors,
}: FooterType) {
  const { translation } = useContext(LanguageContext);

  return (
    <center className="selfieFooter">
      <>
        {!croppedImgSrc || croppedImgSrc === "" ? (
          <Button
            text={translation.take_photo}
            onClick={async () => {
              await handleSubmit();

              console.log(errors);

              if (Object.keys(errors || {}).length > 0) return;

              capture();
            }}
            disabled={
              status?.verified || disabled || address?.province === null
            }
            loading={status?.loading}
            testId="take-photo"
            block
          />
        ) : (
          <>
            <Button
              text={translation.retry}
              onClick={onReloadCamera}
              appearance="default"
              block
              testId="retry"
            />
          </>
        )}
        <Button
          text={translation.use_otp_code}
          onClick={handleSwitchMFAType}
          block
          testId="otp-code"
          appearance="ghost"
          loading={isLoadingOTP}
          disabled={address?.province === null}
        />
        {handleClose && (
          <Button
            text={translation.close}
            onClick={handleClose}
            block
            testId="close"
            appearance="default"
          />
        )}
      </>
    </center>
  );
}

export default SelfieFooter;
