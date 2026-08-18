import { useContext, useEffect, useState, memo } from "react";
import { getStorage, setStorage } from "@/utils/storage";
import Button from "../button";
import { LanguageContext } from "@/context/LanguageContext";
import Modal from "../Modal";
import * as Yup from "yup";
import { Avatar, Text } from "rsuite";
import { UserType } from "@/types/User";
import Input from "../input";
import { useFormik } from "formik";
import { userLoginApi } from "@/api/login";
import toastMessage from "@/utils/common/toastMessage";
import axios from "axios";
import api, { apiHandler } from "@/api";
import Alert from "../alert";
import { cfg } from "@/constants/cfg";
import { useNavigate } from "react-router-dom";

// ✅ Memoized avatar so typing doesn't re-render it
const UserAvatar = memo(({ userInfo }: { userInfo: UserType }) => (
  <center>
    <Avatar
      circle
      src={userInfo?.photo}
      size="lg"
      style={{ marginBottom: "1rem" }}
    >
      <Text>
        {userInfo?.firstName?.charAt(0)}
        {userInfo?.lastName?.charAt(0)}
      </Text>
    </Avatar>
  </center>
));

interface TokenExpiryBannerProps {
  open: boolean;
  setOpen: (b: boolean) => void;
  onSuccessfulReauth: () => void;
  onManualLogout?: () => void;
}

const TokenExpiryBanner = ({
  open,
  setOpen,
  onSuccessfulReauth,
  onManualLogout
}: TokenExpiryBannerProps) => {
  const { translation } = useContext(LanguageContext);
  const [token, setToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserType>({});
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const navigate = useNavigate();

  // ✅ Fetch only when modal opens
  useEffect(() => {
    if (open) {
      console.log("[BANNER] Modal opened, fetching user data");
      getStorage().then((user) => {
        console.log("[BANNER] User data fetched:", user);
        setUserInfo(user);
        setToken(user?.token);
      });
    }
  }, [open]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      formik.resetForm();
      setPasswordVisible(false);
    }
  }, [open]);

  const handleShowPassword = () => setPasswordVisible((prev) => !prev);

  const validationSchema = Yup.object({
    password: Yup.string()
      .required(translation.password_required)
      .typeError(translation.password_required)
  });

  const formik = useFormik<{ password: string }>({
    initialValues: { password: "" },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        if (!token) {
          navigate("/authentication/login");
          setSubmitting(false);
          return;
        }

        const emailAddress = userInfo?.email;
        if (!emailAddress) {
          console.log("[BANNER] No email found, asking user to login manually");
          toastMessage("error", "Session expired. Please login again.");
          setSubmitting(false);
          return;
        }

        console.log("[BANNER] Attempting login with email:", emailAddress);
        const data = await userLoginApi({
          email: emailAddress,
          password: values.password
        });

        if (!data) return;

        if (data?.shouldResetPassword && data?.passwordResetLink) {
          console.log("[BANNER] Password reset required");
          window.location.href = data.passwordResetLink;
          return;
        }

        if (data.tempToken) {
          console.log("[BANNER] Temp token received, refreshing token");
          await handleRefreshToken();
          return;
        }

        console.log("[BANNER] Login successful");
        toastMessage("success", translation.login_successful);
        setOpen(false);
        formik.resetForm();
        onSuccessfulReauth();
      } catch (err) {
        console.error("[BANNER] Login error:", err);
        toastMessage("error", err);
      } finally {
        setSubmitting(false);
      }
    }
  });

  const handleRefreshToken = async () => {
    console.log("[BANNER] Refreshing token...");
    const user = await getStorage();
    const loginType = await getStorage("loginType", "local");

    if (!user?.refreshToken) {
      console.log("[BANNER] No refresh token available");
      toastMessage("error", "Session expired. Please login again.");
      return;
    }

    try {
      const options = {
        url: `/auth/refresh-token`,
        method: "POST",
        data: {
          refreshToken: user.refreshToken
        },
        headers: {
          Authorization: `Bearer ${user.token}`,
          ["x-sdid-api-key"]: cfg.VITE_API_KEY,
          ["x-sdid-api-secret-key"]: cfg.VITE_API_SECRET_KEY
        },
        isLocalServiceEnabled: loginType === "local" ? true : false,
        isRemoteFetchForceEnabled: loginType === "remote" ? true : false
      };
      const response = await api(options);

      // Update tokens
      const token = response.data.token;
      const updatedRefreshToken = response.data.refreshToken;

      user.token = token;
      user.refreshToken = updatedRefreshToken;

      await setStorage(user);

      console.log("[BANNER] Token refreshed successfully");
      toastMessage("success", "Session restored successfully");
      setOpen(false);
      formik.resetForm();
      onSuccessfulReauth(); // Call this after successful token refresh
    } catch (err) {
      console.error("[BANNER] Token refresh error:", err);
      toastMessage("error", "Token refresh failed. Please login again.");
    }
  };

  const handleManualLogin = () => {
    console.log("[BANNER] User chose manual login");
    setIsRedirecting(true);

    // Call the manual logout callback if provided
    onManualLogout?.();

    // Use navigate instead of window.location for better React Router integration
    window.location.href = "/authentication/login";
  };

  const handleCloseModal = () => {
    console.log("[BANNER] User closed modal");
    setOpen(false);
    formik.resetForm();
    // Don't call onSuccessfulReauth here - user explicitly closed the modal
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !formik.isSubmitting) {
      formik.handleSubmit();
    }
  };

  return (
    <Modal
      show={open}
      size="xs"
      backdrop="static"
      role="alertdialog"
      isBlur
      title={translation.login_to_continue}
      handleClose={handleCloseModal}
    >
      <div className="rs-modal-body" onKeyPress={handleKeyPress}>
        <p
          style={{
            textAlign: "center",
            marginBottom: "1rem",
            color: "var(--text-secondary)",
          }}
        ></p>

        <Alert type="error">
          {translation.session_expired_due_to_inactivity}
        </Alert>
        <br />

        <Input
          name="password"
          label={translation.password}
          placeholder={translation.password_placeholder}
          required
          value={formik.values.password}
          onChange={(value) => formik.setFieldValue("password", value)}
          error={formik.errors.password}
          type={passwordVisible ? "text" : "password"}
          leftIcon="lock"
          rightIcon={passwordVisible ? "visibility" : "visibility_off"}
          handleShowPassword={handleShowPassword}
          testId="password"
          autoFocus // Auto focus on password field when modal opens
          labelRightContent={
            <a
              href="/authentication/forgotPassword"
              data-testid="forgot-password-link"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "/authentication/forgotPassword";
              }}
            >
              {translation.forgot_password}?
            </a>
          }
        />

        <div style={{ marginBottom: "1rem" }}>
          <Button
            block
            text={translation.login}
            onClick={formik.handleSubmit}
            size="lg"
            loading={formik.isSubmitting}
            disabled={!formik.values.password} // Disable if no password entered
          />
        </div>

        <div style={{ textAlign: "center" }}>
          <Button
            text="Login with different account"
            onClick={handleManualLogin}
            size="lg"
            appearance="ghost"
            loading={isRedirecting}
            block
          />
        </div>
      </div>
    </Modal>
  );
};

export default TokenExpiryBanner;
