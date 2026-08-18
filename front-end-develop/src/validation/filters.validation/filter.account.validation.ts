import * as Yup from "yup";

export const searchValidationSchema = (translation: any) => {
  return Yup.object({
    firstName: Yup.string()
      .nullable()
      .notRequired()
      .typeError(translation.first_name_required),
    lastName: Yup.string()
      .nullable()
      .notRequired()
      .typeError(translation.last_name_required),
    email: Yup.string()
      .nullable()
      .email(translation.invalid_email)
      .notRequired()
      .test("has-dot-in-domain", translation.invalid_email, (value) => {
        // Split on @ and check if domain has a dot
        if (!value) return true; // Skip validation if value is null/undefined
        const parts = value.split("@");
        return parts.length === 2 && parts[1].includes(".");
      })
      .typeError(translation.email_address_required),
    phoneNumber: Yup.string()
      .nullable()
      .notRequired()
      .typeError(translation.phone_number_required),
    idNumber: Yup.string()
      .nullable()
      .notRequired()
      .test("starts-with-type-prefix", function (value) {
        const { type } = this.parent; // Access the current `type` value in the form

        // Validate if the `documentIdentificationNumber` starts with `type.startWith`
        if (value && !value?.startsWith("1")) {
          return this.createError({
            path: "idNumber",
            message: `${translation.invalid_id_number}`,
          });
        }

        return true; // Pass validation if all checks are satisfied
      })
      .min(16, translation.invalid_id_number),
  });
};
