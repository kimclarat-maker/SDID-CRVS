import * as Yup from "yup";

export const searchPreEnrollmentNumberValidationSchema = (translation: any) => {
  return Yup.object({
    search: Yup.string()
      .nullable()
      .notRequired()
      .typeError(translation.enter_prenrollment_number),
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

export const searchIDNumberValidationSchema = (translation: any) => {
  return Yup.object({
    search: Yup.string()
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

export const searchApplicationNumberValidationSchema = (translation: any) => {
  return Yup.object({
    search: Yup.string()
      .nullable()
      .notRequired()

      .min(10, translation.invalid_application_number),
  });
};

export const searchCustomValidationSchema = (translation: any) => {
  return Yup.object({
    firstName: Yup.string()
      .nullable()
      .notRequired()
      .typeError(translation.first_name_required),
    lastName: Yup.string()
      .nullable()
      .notRequired()
      .typeError(translation.last_name_required),
    dob: Yup.string()
      .nullable()
      .notRequired()
      .typeError(translation.dob_required),

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
