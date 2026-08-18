import * as Yup from "yup";

export const rollBackValidationSchema = (translation: any) => {
  return Yup.object({
    rollbackReason: Yup.string()
      .required(translation.reason_required)
      .typeError(translation.reason_required),
  });
};
