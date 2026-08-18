import * as Yup from "yup";

export const searchValidationSchema = (translation: any) => {
  return Yup.object({
    search: Yup.string()
      .nullable()
      .notRequired()
      .typeError(translation.prenrollment_number_required),
    firstName: Yup.string()
      .nullable()
      .notRequired()
      .typeError(translation.first_name_required),
    lastName: Yup.string()
      .nullable()
      .notRequired()
      .typeError(translation.last_name_required),
    fatherName: Yup.string()
      .nullable()
      .notRequired()
      .typeError(translation.father_name_required),
    motherName: Yup.string()
      .nullable()
      .notRequired()
      .typeError(translation.mother_name_required),
  });
};
