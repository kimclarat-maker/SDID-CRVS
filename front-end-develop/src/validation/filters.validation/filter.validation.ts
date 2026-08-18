import * as Yup from "yup";

export const searchValidationSchema = (translation: any) => {
  return Yup.object({
    // province: Yup.string()
    //   .required(translation.province_required)
    //   .typeError(translation.province_required),
    // district: Yup.string()
    //   .required(translation.district_required)
    //   .typeError(translation.district_required),
    // sector: Yup.string()
    //   .required(translation.sector_required)
    //   .typeError(translation.sector_required),
    // cell: Yup.string()
    //   .required(translation.cell_required)
    //   .typeError(translation.cell_required),
    // village: Yup.string()
    //   .required(translation.village_required)
    //   .typeError(translation.village_required),
  });
};
