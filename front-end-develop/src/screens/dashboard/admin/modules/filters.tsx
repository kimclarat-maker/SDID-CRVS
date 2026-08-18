import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useMemo } from "react";
import { useFormik } from "formik";
import toastMessage from "@/utils/common/toastMessage";
import { searchValidationSchema } from "@/validation/filters.validation/filter.validation";
import MainFilters from "@/components/forms/filters/main";

interface FormType {
  search: string;
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
      search: filters?.search,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        console.log(values);
        setFilters((prev: any) => ({
          ...prev,
          search: values?.search,
        }));
      } catch (error) {
        toastMessage("error", error);
      }
    },
    enableReinitialize: true,
  });

  return (
    <MainFilters
      availableFilters={["search"]}
      {...formik}
      searchFiledName="search"
      searchLabel={translation.search}
      showSearchButton
    />
  );
};

export default Filters;
