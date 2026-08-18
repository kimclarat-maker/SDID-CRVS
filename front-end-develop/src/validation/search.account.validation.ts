import * as Yup from "yup";

export const searchAccountValidationSchema = (translation: any) => {
  return Yup.object({
    search: Yup.string()
      .required(translation.search_required)
      .typeError(translation.search_required),
  });
};
