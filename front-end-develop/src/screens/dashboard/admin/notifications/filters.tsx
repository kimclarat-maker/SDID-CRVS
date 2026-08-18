import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useMemo } from "react";
import { useFormik } from "formik";
import toastMessage from "@/utils/common/toastMessage";
import errors from "@/constants/errors";
import { FilterContext } from "@/context/FilterContext";
import { notificationsValidationSchema } from "@/validation/filters.validation/notification.validation";
import MainFilters from "@/components/forms/filters/main";

interface FormType {
  startDate: string;
  endDate: string;
  status: string | null;
}

const Filters = ({ page }: { page: string }) => {
  const { translation } = useContext(LanguageContext);
  const { setFilters, filters } = useContext(FilterContext);

  const validationSchema = useMemo(
    () => notificationsValidationSchema(translation),
    [translation]
  );

  const formik = useFormik<FormType>({
    initialValues: {
      startDate: filters?.[page]?.startDate || "",
      endDate: filters?.[page]?.endDate || "",
      status: null,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setFilters((prev: any) => ({
          ...prev,
          [page]: {
            ...prev[page],
            ...values,
          },
        }));
      } catch (error) {
        toastMessage("error", errors(translation.default, error)["002"]);
      }
    },
    enableReinitialize: true,
  });
  return <MainFilters availableFilters={["status", "date"]} {...formik} />;
};

export default Filters;
