import * as Yup from "yup";

export const enrollmentsValidationSchema = (translation: any) => {
  return Yup.object({
    startDate: Yup.string()
      .required(translation.start_date_required)
      .typeError(translation.start_date_required),
    endDate: Yup.string()
      .required(translation.end_date_required)
      .typeError(translation.end_date_required),
  });
};
