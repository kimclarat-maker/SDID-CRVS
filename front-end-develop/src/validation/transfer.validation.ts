import * as Yup from "yup";

export const transferValidationSchema = (translation: any) => {
  return Yup.object({
    origin: Yup.string()
      .required(translation.center_origin_required)
      .typeError(translation.center_origin_required),

    destination: Yup.string()
      .required(translation.center_destination_required)
      .typeError(translation.center_destination_required),
  });
};
