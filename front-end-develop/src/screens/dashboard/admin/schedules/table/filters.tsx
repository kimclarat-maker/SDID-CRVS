import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useMemo } from "react";
import { useFormik } from "formik";
import toastMessage from "@/utils/common/toastMessage";
import errors from "@/constants/errors";
import { FilterContext } from "@/context/FilterContext";
import AnalyticFilters from "@/components/forms/filters/main";
import { reportsValidationSchema } from "@/validation/filters.validation/reports.validation";
import { CenterType } from "@/types/Center";
import MainFilters from "@/components/forms/filters/main";
import { searchValidationSchema } from "@/validation/filters.validation/filter.validation";

interface FormType {
  startDate: string;
  endDate: string;
  center: CenterType | null;
  requestNo: string | null;
  status: string | null;
  appointmentNo: string | null;
}

const Filters = () => {
  const { translation } = useContext(LanguageContext);
  const { setFilters, filters } = useContext(FilterContext);

  const validationSchema = useMemo(
    () => searchValidationSchema(translation),
    [translation]
  );

  const formik = useFormik<FormType>({
    initialValues: {
      startDate: filters?.startDate || "",
      endDate: filters?.endDate || "",
      center: null,
      status: null,
      requestNo: null,
      appointmentNo: null,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setFilters((prev: any) => ({
          ...prev,
          appointmentNo: values.appointmentNo,
          requestNo: values.requestNo,
          center: values.center,
          status: values.status,
          startDate: values.startDate,
          endDate: values.endDate,
        }));
      } catch (error) {
        toastMessage("error", errors(translation.default, error)["002"]);
      }
    },
    enableReinitialize: true,
  });
  return (
    <MainFilters
      availableFilters={[
        "center",
        "startDate",
        "endDate",
        "appointmentNo",
        "requestNo",
      ]}
      {...formik}
      showSearchButton
    />
  );
};

export default Filters;
