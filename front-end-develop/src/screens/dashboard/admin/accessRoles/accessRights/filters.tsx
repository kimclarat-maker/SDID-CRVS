import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useMemo } from "react";
import { useFormik } from "formik";
import toastMessage from "@/utils/common/toastMessage";
import errors from "@/constants/errors";
import { searchValidationSchema } from "@/validation/filters.validation/filter.validation";
import MainFilters from "@/components/forms/filters/main";

interface FormType {
  search: string;
  role: any;
}

const Filters = ({
  setFilters,
  filters,
}: {
  setFilters: (f: any) => void;
  filters: any;
}) => {
  const { translation } = useContext(LanguageContext);

  const validationSchema = useMemo(
    () => searchValidationSchema(translation),
    [translation]
  );

  const formik = useFormik<FormType>({
    initialValues: {
      search: "",
      role: null,
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
      availableFilters={["search", "roles"]}
      {...formik}
      searchFiledName="search"
      searchLabel={translation.search}
      showSearchButton
    />
  );
};

export default Filters;
