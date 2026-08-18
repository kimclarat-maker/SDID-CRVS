import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect, useMemo } from "react";
import { useFormik } from "formik";
import toastMessage from "@/utils/common/toastMessage";
import FormLayout from "@/layout/form/formLayout";
import { ForgotPasswordType } from "@/types/ForgotPassword";
import ForgotPasswordForm from "@/components/forms/forgotPassword";
import { sendPasswordResetLink } from "@/api/accounts";
import { useParams } from "react-router-dom";
import { forgotPasswordValidationSchema } from "@/validation/forgotpassword.validation";

export default function ForgotPassword() {
  const { translation } = useContext(LanguageContext);
  const { email } = useParams();

  const validationSchema = useMemo(
    () => forgotPasswordValidationSchema(translation),
    [translation]
  );

  const formik = useFormik<ForgotPasswordType>({
    initialValues: {
      email: "",
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      await handleSendOtp(values.email?.toLowerCase(), resetForm);
    },
  });

  useEffect(() => {
    if (email && email !== "") {
      formik.setValues({
        email,
      });
      handleSendOtp(email);
    }
  }, [email]);

  const handleSendOtp = async (email?: string, resetForm?: () => void) => {
    if (!email) return;

    try {
      const data = await sendPasswordResetLink({
        email,
      });

      if (data) {
        toastMessage("success", data.message);

        resetForm && resetForm();

        return;
      }

      toastMessage("error");
    } catch (error: any) {
      toastMessage("error", error);
    }
  };

  return (
    <FormLayout
      title={translation.forgot_password + "?"}
      description={translation.forgot_password_description}
      size={4}
      headerStyle={{ flexDirection: "column", alignItems: "flex-start" }}
    >
      <div className="formBody">
        <ForgotPasswordForm {...formik} />
      </div>
    </FormLayout>
  );
}
