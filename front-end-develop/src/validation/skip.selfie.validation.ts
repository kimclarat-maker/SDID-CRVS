import * as Yup from "yup";

export const phoneSkipSelfieValidationSchema = (translation: any) => {
  return Yup.object({
    country: Yup.string()
      .required(translation.country_required)
      .typeError(translation.country_required),
    phoneNumber: Yup.string()
      .nullable()
      .required(translation.phone_number_required)
      .typeError(translation.phone_number_required)
      .test(
        "valid-phone-number",
        translation.invalid_phone,
        (value, context) => {
          // Check if the country is Rwanda (+250) and the phone number is not empty
          if (context.parent.country?.value === "+250" && value) {
            // Check if the phone number starts with one of the valid prefixes
            if (
              !value.startsWith("78") &&
              !value.startsWith("72") &&
              !value.startsWith("79") &&
              !value.startsWith("73")
            ) {
              return false; // Invalid phone number
            }
          }
          return true; // Valid phone number
        }
      ),
  });
};

export const emailSkipSelfieValidationSchema = (translation: any) => {
  return Yup.object({
    email: Yup.string().when("phoneNumber", {
      is: (phone: string) => !phone || phone.trim() === "",
      then: (schema) =>
        schema
          .required(translation.email_required)
          .email(translation.invalid_email),
      otherwise: (schema) =>
        schema.test(
          "valid-email-format",
          translation.invalid_email,
          (value) => {
            if (!value || value.trim() === "") return true;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value);
          }
        ),
    }),
  });
};
