import { LanguageContext } from "@/context/LanguageContext";
import toastMessage from "@/utils/common/toastMessage";
import Button from "@/components/button";
import Loading from "@/components/loader";
import CountdownTimer from "@/components/CountdownTimer";
import Input from "@/components/input";
import useCountdownTimer from "@/hooks/useCountdownTimer";
import { Stack, Text } from "rsuite";
import { userSendOTPByEmail } from "@/api/login";
import { ChangeEvent, useContext, useEffect, useState } from "react";
import { getStorage } from "@/utils/storage";

const OTP_LENGTH = 6;

type FormTypes = {
  errors: any;
  handleSubmit: () => void;
  isSubmitting: boolean;
  values: any;
  handleChange: (e: ChangeEvent<any>) => void;
  setFieldValue: any;
  user?: any;
  handleSwitchMFAType?: () => void;
  requestRenewSession?: () => void;
};

export default function OTPCodeForm({
  errors,
  handleSubmit,
  isSubmitting,
  values,
  setFieldValue,
  user,
  handleSwitchMFAType,
  requestRenewSession,
}: FormTypes) {
  const { translation } = useContext(LanguageContext);
  const { seconds, isRunning, startTimer } = useCountdownTimer(300);
  const [resending, setResending] = useState(false);

  const resend = async () => {
    if (requestRenewSession) {
      setResending(true);
      await requestRenewSession();
      setResending(false);
      return;
    }
    handleSendOTP();
  };

  const handleSendOTP = async () => {
    setResending(true);
    try {
      if (!user) return;

      setFieldValue("code", "");

      const data: any = await userSendOTPByEmail(user.email, user.tempToken);
      toastMessage("success", `${data?.data?.message || data?.message}`);
      setResending(false);
      startTimer();
    } catch (error) {
      setResending(false);
      toastMessage("error", error);
    }
  };

  useEffect(() => {
    if (values.code.length === OTP_LENGTH) {
      handleSubmit();
    }
  }, [values.code]);

  return (
    <div data-testid="otp-form">
      <div>
        <Input
          name="code"
          label={translation.otp}
          placeholder={translation.enter_otp_code}
          required
          value={values.code}
          onChange={(value) => setFieldValue("code", value)}
          error={errors.code}
          leftIcon="key"
          type="number"
          maxLength={OTP_LENGTH}
          rightContent={
            isRunning ? (
              <div data-testid="timer-wrapper">
                <CountdownTimer
                  initialDuration={seconds}
                  testId="countdown-timer"
                />
              </div>
            ) : (
              <>
                {resending ? (
                  <div data-testid="loading-wrapper">
                    <Loading data-testid="loading-indicator" />
                  </div>
                ) : (
                  <div onClick={resend} data-testId="resend-button">
                    <Text className="textBold textPrimary">
                      {translation.resend}
                    </Text>
                  </div>
                )}
              </>
            )
          }
          helperText={
            !values.code || values.code === ""
              ? translation.otp_code_description
              : ""
          }
          testId="code"
        />
      </div>
      <Stack>
        {handleSwitchMFAType && (
          <Stack.Item>
            <Button
              text={translation.facial_verification}
              onClick={handleSwitchMFAType}
              testId="facial-button"
              appearance="ghost"
            />
          </Stack.Item>
        )}

        <Stack.Item grow={1} />
        <Stack.Item>
          <Button
            text={translation.verify_otp}
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting || values.code === ""}
            testId="submit-button"
          />
        </Stack.Item>
      </Stack>
    </div>
  );
}
