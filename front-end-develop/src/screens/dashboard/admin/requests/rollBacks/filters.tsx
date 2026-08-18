import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useMemo } from "react";
import { useFormik } from "formik";
import toastMessage from "@/utils/common/toastMessage";
import errors from "@/constants/errors";
import { searchValidationSchema } from "@/validation/filters.validation/filter.rollback.validation";
import { CenterType } from "@/types/Center";
import MainFilters from "@/components/forms/filters/main";

interface FormType {
  startDate: string;
  endDate: string;
  center: CenterType | null;
}

const Filters = ({
  setFilters,
  filters,
}: {
  filters: any;
  setFilters: (f: any) => void;
}) => {
  const { translation } = useContext(LanguageContext);

  const validationSchema = useMemo(
    () => searchValidationSchema(translation),
    [translation]
  );

  const formik = useFormik<FormType>({
    initialValues: {
      startDate: filters?.startDate || "",
      endDate: filters?.endDate || "",
      center: null,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setFilters((prev: any) => ({
          ...prev,
          ...values,
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
        "search",
        "identifier",
        "enrollmentStatus",
        "preEnrollmentStatus",
      ]}
      {...formik}
      searchFiledName="search"
      searchLabel={translation.search_by_prenrollment_number}
      searchPlaceholder={translation.enter_id_number}
      showSearchButton
    />
  );
};

export default Filters;
