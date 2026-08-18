import * as Yup from "yup";

export const searchValidationSchema = (translation: any) => {
  return Yup.object({
    type: Yup.object()
      .required(translation.type_required)
      .typeError(translation.type_required),

    // PRE-ENROLLMENT NUMBER
    search: Yup.string()
      .nullable()
      .notRequired()
      .when("type", {
        is: (type: any) => type?.value === "prenrollmentNo",
        then: (schema) =>
          schema
            .required(translation.enter_prenrollment_number)
            .typeError(translation.enter_prenrollment_number)
            .test("starts-with-type-prefix", function (value) {
              const { type } = this.parent;
              if (
                value &&
                !value?.toUpperCase()?.startsWith("PR") &&
                !value?.toUpperCase()?.startsWith("AP")
              ) {
                return this.createError({
                  path: "search",
                  message: translation.invalid_preEnrollment_number,
                });
              }
              return true;
            }),
      })
      .when("type", {
        is: (type: any) => type?.value === "enrollmentNo",
        then: (schema) =>
          schema
            .required(translation.enter_enrollment_number)
            .typeError(translation.enter_enrollment_number)
            .test("starts-with-type-prefix", function (value) {
              if (value && !value?.toUpperCase()?.startsWith("EN")) {
                return this.createError({
                  path: "search",
                  message: translation.invalid_enrollment_number,
                });
              }
              return true;
            }),
      })
      .when("type", {
        is: (type: any) => type?.value === "idNumber",
        then: (schema) =>
          schema
            .required(translation.id_number_required)
            .min(16, translation.invalid_id_number)
            .max(22, translation.invalid_id_number)
            .test("starts-with-type-prefix", function (value) {
              const { type } = this.parent;
              if (
                value &&
                !value?.startsWith("1") &&
                !value?.startsWith("2") &&
                !value?.startsWith("3")
              ) {
                return this.createError({
                  path: "search",
                  message: translation.invalid_id_number,
                });
              }
              return true;
            }),
      })
      .when("type", {
        is: (type: any) => type?.value === "applicationNumber",
        then: (schema) =>
          schema
            .required(translation.invalid_application_number)
            .min(8, translation.invalid_application_number),
      }),

    // CUSTOM SEARCH (NAMES, DOB, PHONE, ID)
    firstName: Yup.string().when("type", {
      is: (type: any) => type?.value === "custom",
      then: (schema) =>
        schema
          .required(translation.first_name_required)
          .typeError(translation.first_name_required),
      otherwise: (schema) => schema.notRequired(),
    }),

    idNumber: Yup.string()
      .nullable()
      .notRequired()
      .when("type", {
        is: (type: any) => type?.value !== "custom",
        then: (schema) =>
          schema
            .min(16, translation.invalid_id_number)
            .test("starts-with-type-prefix", function (value) {
              const { type } = this.parent;
              if (value && !value?.startsWith("1")) {
                return this.createError({
                  path: "idNumber",
                  message: translation.invalid_id_number,
                });
              }
              return true;
            }),
      }),
  });
};

// export const searchValidationSchema = (translation: any) => {
//   return Yup.object({
//     type: Yup.object()

//       .required(translation.type_required)
//       .typeError(translation.type_required),
//     firstName: Yup.string().when("type", {
//       is: "custom",
//       then: (schema) =>
//         schema
//           .required(translation.surname_required)
//           .typeError(translation.surname_required),
//       otherwise: (schema) => schema.notRequired(),
//     }),

//     lastName: Yup.string().when("type", {
//       is: "custom",
//       then: (schema) =>
//         schema
//           .required(translation.post_name_required)
//           .typeError(translation.post_name_required),
//       otherwise: (schema) => schema.notRequired(),
//     }),
//     dob: Yup.string().when("type", {
//       is: "custom",
//       then: (schema) =>
//         schema
//           .required(translation.dob_required)
//           .typeError(translation.dob_required),
//       otherwise: (schema) => schema.notRequired(),
//     }),
//     //MAKE PARENT NAMES MANDATORY
//     // fatherNames: Yup.string().when("type", {
//     //   is: "custom",
//     //   then: (schema) =>
//     //     schema
//     //       .required(translation.father_names_required)
//     //       .typeError(translation.father_names_required),
//     //   otherwise: (schema) => schema.notRequired(),
//     // }),
//     // motherNames: Yup.string().when("type", {
//     //   is: "custom",
//     //   then: (schema) =>
//     //     schema
//     //       .required(translation.mother_names_required)
//     //       .typeError(translation.mother_names_required),
//     //   otherwise: (schema) => schema.notRequired(),
//     // }),
//   });
// };
