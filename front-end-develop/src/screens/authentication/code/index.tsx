import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useMemo } from "react";
import { useFormik } from "formik";
import toastMessage from "@/utils/common/toastMessage";
import { useNavigate } from "react-router-dom";
import { OTPType } from "@/types/OTP";
import useCountdownTimer from "@/hooks/useCountdownTimer";
import { UserType } from "@/types/User";
import { getStorage, removeStorageItem, setStorage } from "@/utils/storage";
import { userLoginVerifyCodeApi } from "@/api/login";
import OTPCodeForm from "@/components/forms/login/otp-code";
import { otpValidationSchema } from "@/validation/otp.validation";
import api from "@/api";
import { defineAccess } from "@/utils/common/permissions";
import { syncAccountData } from "@/api/accounts";
import { useLocalService } from "@/context/LocalServiceContext";
import { resolvePostLoginRoute } from "@/utils/workspace";

export default function OTPCode({
  user,
  handleSwitchMFAType,
  isRenewSession,
  timeoutId,
  setOpenModal,
  requestRenewSession,
  addressFormik,
  handleSubmit,
  isLocalServiceEnabled,
}: {
  user: UserType;
  getStarted?: boolean;
  handleSwitchMFAType: () => void;
  isRenewSession?: boolean;
  setOpenModal?: (b: boolean) => void;
  timeoutId?: any;
  requestRenewSession?: () => void;
  addressFormik?: any;
  handleSubmit?: () => void;
  isLocalServiceEnabled?: boolean;
}) {
  const navigate = useNavigate();
  const { translation } = useContext(LanguageContext);
  const { resetTimer } = useCountdownTimer(300);

  const { isLocalServiceActive: isLocalServiceInstalledAndActive } =
    useLocalService();

  const validationSchema = useMemo(
    () => otpValidationSchema(translation),
    [translation]
  );

  const formik = useFormik<OTPType>({
    initialValues: {
      code: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        handleSubmit && (await handleSubmit());

        if (isRenewSession) {
          await verifyRenewSessionCode(values);
          return;
        }

        // Use address from addressFormik if available
        const addressValues = addressFormik?.values || {};
        await handleLogin(values, addressValues);
      } catch (error: any) {
        console.log(error);
        toastMessage("error", error);
      }
    },
  });

  let count = 0;

  const handleLogin = async (values: any, addressValues: any) => {
    const localStorage = await getStorage("applicantAddress", "local");

    // Use address from formik or fallback to localStorage
    const address = {
      province: {
        name: addressValues?.province?.name || localStorage?.province?.name,
        id: addressValues?.province?.value || localStorage?.province?.id,
        code: addressValues?.province?.code || localStorage?.province?.code,
      },
      district: {
        name: addressValues?.district?.name || localStorage?.district?.name,
        id: addressValues?.district?.value || localStorage?.district?.id,
        code: addressValues?.district?.code || localStorage?.district?.code,
      },
      sector: {
        name: addressValues?.sector?.name || localStorage?.sector?.name,
        id: addressValues?.sector?.value || localStorage?.sector?.id,
        code: addressValues?.sector?.code || localStorage?.sector?.code,
      },
      cell: {
        name: addressValues?.cell?.name || localStorage?.cell?.name,
        id: addressValues?.cell?.value || localStorage?.cell?.id,
        code: addressValues?.cell?.code || localStorage?.cell?.code,
      },
      village: {
        name: addressValues?.village?.name || localStorage?.village?.name,
        id: addressValues?.village?.value || localStorage?.village?.id,
        code: addressValues?.village?.code || localStorage?.village?.code,
      },
    };

    await setStorage(address, "applicantAddress", "local");

    let body: any = {
      code: values.code,
      email: user.email,
      tempToken: user.tempToken,
      ...address,
    };

    const data = await userLoginVerifyCodeApi(body);

    resetTimer();

    count += 1;

    const now = new Date();
    const fiveMinutesLater: any = new Date(
      now.getTime() + 10 * 60 * 1000
    ).getTime();

    if (data.token) {
      if (data.shouldResetPassword && data.passwordResetLink) {
        return navigate(data.passwordResetLink);
      }

      await setStorage(data);
      await setStorage(fiveMinutesLater, "lastLoginTime");

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
        await syncAccountData(data);
      }

      navigate(resolvePostLoginRoute());
      return;
    }
    toastMessage("error", translation.login_failed);
  };

  const verifyRenewSessionCode = async (values: any) => {
    const options = {
      url: "/auth/verify-session-renew-code",
      method: "POST",
      data: {
        code: values.code,
      },
      isRemoteFetchForceEnabled: true,
    };

    const data: any = await api(options);

    toastMessage("success", data?.message?.errorDescription);

    // User logs in; reset everything
    if (timeoutId.current !== null) {
      clearTimeout(timeoutId.current);
    }

    setOpenModal && setOpenModal(false); // Close modal
    resetTimer();
  };

  return (
    <div className="rs-modal-body">
      <OTPCodeForm
        {...formik}
        user={user}
        handleSwitchMFAType={handleSwitchMFAType}
        requestRenewSession={requestRenewSession}
      />
    </div>
  );
}
