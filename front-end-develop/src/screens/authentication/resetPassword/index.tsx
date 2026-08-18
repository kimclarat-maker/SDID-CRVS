import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import toastMessage from "@/utils/common/toastMessage";
import FormLayout from "@/layout/form/formLayout";
import { ResetPasswordType } from "@/types/ResetPassword";
import ResetPasswordForm from "@/components/forms/resetPassword";
import { passwordReset, verifyPasswordResetLink } from "@/api/accounts";
import { useNavigate, useParams } from "react-router-dom";
import Loading from "@/components/loader";
import { Text } from "rsuite";
import Empty from "@/components/empty";
import Button from "@/components/button";
import { resetPasswordValidationSchema } from "@/validation/resetpassword.validation";

export default function ResetPassword() {
  const { translation } = useContext(LanguageContext);
  const { token } = useParams();
  const navigate = useNavigate();
  const [isVerifying, setVerifyLink] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const validationSchema = useMemo(
    () => resetPasswordValidationSchema(translation),
    [translation]
  );

  const formik = useFormik<ResetPasswordType>({
    initialValues: {
      password: "",
      newPassword: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        if (!token)
          return toastMessage("error", "Missing required field: TOKEN");
        const data = await passwordReset({
          newPassword: values.newPassword,
          token,
        });

        if (data) {
          toastMessage("success", data.message);

          navigate(`/authentication/login`);

          return;
        }

        toastMessage("error");
      } catch (error: any) {
        toastMessage("error", error);
      }
    },
  });

  useEffect(() => {
    if (!token) return navigate("/authentication/forgotPassword");

    const verifyLink = async () => {
      try {
        setVerifyLink(true);

        await verifyPasswordResetLink({
          token,
        });

        setIsValid(true);
        setVerifyLink(false);
      } catch (error) {
        toastMessage("error", error);
        setVerifyLink(false);
        setIsValid(false);
      }
    };
    verifyLink();
  }, []);

  if (isVerifying) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <center>
          <Loading size="md" />
          <Text>{translation.verifying_link}</Text>
        </center>
      </div>
    );
  }

  if (isValid) {
    return (
      <FormLayout
        title={translation.reset_password}
        size={4}
        headerStyle={{ flexDirection: "column", alignItems: "flex-start" }}
      >
        <div className="formBody" data-testid="reset-password-form">
          <ResetPasswordForm {...formik} />
        </div>
      </FormLayout>
    );
  }

  return (
    <Empty
      icon="lock"
      isFullScreen
      title={translation.password_reset_link_may_be_invalid_or_expired}
      button={
        <Button
          text={translation.go_back}
          onClick={() => navigate("/authentication/forgotPassword")}
        />
      }
    />
  );
}
