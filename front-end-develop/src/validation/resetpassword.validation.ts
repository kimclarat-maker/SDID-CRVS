import * as Yup from "yup";

export const resetPasswordValidationSchema = (translation: any) => {
  return Yup.object({
    password: Yup.string()
      .min(8, translation.password_length)
      .required(translation.password_required)
      .typeError(translation.password_required),

    newPassword: Yup.string()
      .min(8, translation.password_length)
      .oneOf([Yup.ref("password"), ""], translation.password_must_match)
      .required(translation.password_required)
      .typeError(translation.password_required)
      // Check for at least 1 uppercase letter
      .test(
        "has-uppercase",
        translation.password_missing_upper, // e.g., "Must contain at least 1 uppercase letter (A-Z)"
        (value) => /[A-Z]/.test(value)
      )
      // Check for at least 1 symbol
      .test(
        "has-symbol",
        translation.password_missing_symbol, // e.g., "Must contain at least 1 symbol (!@#$%^&*)"
        (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value)
      ),
  });
};
