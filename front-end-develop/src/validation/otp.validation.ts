import * as Yup from "yup";

export const otpValidationSchema = (translation: any) => {
  return Yup.object({
    code: Yup.string()
      .required(translation.otp_code_required)
      .typeError(translation.otp_code_required),
  });
};

export const addressValidationSchema = (translation: any) => {
  return Yup.object({
    // country: Yup.object()
    //   .required(translation.country_required)
    //   .typeError(translation.country_required),
    province: Yup.object()
      .required(translation.province_required)
      .typeError(translation.province_required),
    district: Yup.object()
      .required(translation.district_required)
      .typeError(translation.district_required),
    sector: Yup.object()
      .required(translation.sector_required)
      .typeError(translation.sector_required),
    cell: Yup.object()
      .required(translation.cell_required)
      .typeError(translation.cell_required),
    village: Yup.object()
      .required(translation.village_required)
      .typeError(translation.village_required),
  });
};
