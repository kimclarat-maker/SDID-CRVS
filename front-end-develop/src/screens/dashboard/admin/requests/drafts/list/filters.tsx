import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useMemo } from "react";
import { useFormik } from "formik";
import toastMessage from "@/utils/common/toastMessage";
import errors from "@/constants/errors";
import { CenterType } from "@/types/Center";
import MainFilters from "@/components/forms/filters/main";
import { searchValidationSchema } from "@/validation/filters.validation/filter.validation";

interface FormType {
  startDate: string | null;
  endDate: string | null;
  center: CenterType | null;
  search: "";
  enrollmentStatus: string;
}

const AppFilters = ({
  filters,
  setFilters,
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
      startDate: null,
      endDate: null,
      center: null,
      search: "",
      enrollmentStatus: filters?.enrollmentStatus,
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
        // "region",
        // "center",
        // "date",
        // "enrollmentStatus",
        "firstName",
        "lastName",
        "fatherName",
        "motherName",
        "startDate",
        "endDate",
      ]}
      {...formik}
      searchFiledName="search"
      searchLabel={translation.search_by_prenrollment_number}
      searchPlaceholder={translation.enter_id_number}
      showSearchButton
    />
  );
};

export default AppFilters;
