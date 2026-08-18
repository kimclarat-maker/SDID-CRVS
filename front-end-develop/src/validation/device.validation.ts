import * as Yup from "yup";

export const deviceValidationSchema = (translation: any) => {
  return Yup.object({
    serialNumber: Yup.object()
      .typeError(translation.serial_number_required)
      .required(translation.serial_number_required),
    condition: Yup.string()
      .typeError(translation.field_required)
      .required(translation.field_required),
    model: Yup.string()
      .typeError(translation.model_required)
      .required(translation.model_required),
    deviceType: Yup.object()
      .typeError(translation.type_required)
      .required(translation.type_required),
    name: Yup.string()
      .typeError(translation.name_required)
      .required(translation.name_required),
    status: Yup.string()
      .typeError(translation.status_required)
      .required(translation.status_required),
  });
};
