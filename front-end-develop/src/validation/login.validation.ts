import * as Yup from "yup";

export const loginValidationSchema = (translation: any) => {
  return Yup.object({
    email: Yup.string()
      .email(translation.invalid_email)
      .required(translation.email_address_required)
      .typeError(translation.email_address_required)
      .test("has-dot-in-domain", translation.invalid_email, (value) => {
        // Split on @ and check if domain has a dot
        const parts = value.split("@");
        return parts.length === 2 && parts[1].includes(".");
      }),
    password: Yup.string()
      .required(translation.password_required)
      .typeError(translation.password_required),
  });
};

export const verifyAccountValidationSchema = (translation: any) => {
  return Yup.object({
    password: Yup.string()
      .required(translation.password_required)
      .typeError(translation.password_required),
  });
};
