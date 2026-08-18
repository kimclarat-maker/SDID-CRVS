import * as Yup from "yup";

export const irisValidationSchema = (translation: any) => {
  return Yup.object({
    timeoutSeconds: Yup.string()
      .required(translation.field_required)
      .typeError(translation.field_required),
  });
};
