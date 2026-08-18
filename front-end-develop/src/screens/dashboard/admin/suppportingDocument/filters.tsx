import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useMemo } from "react";
import { useFormik } from "formik";
import toastMessage from "@/utils/common/toastMessage";
import errors from "@/constants/errors";
import { FilterContext } from "@/context/FilterContext";
import { searchValidationSchema } from "@/validation/filters.validation/filter.validation";
import MainFilters from "@/components/forms/filters/main";

interface FormType {
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
  search?: string;
}

const Filters = ({ page }: { page: string }) => {
  const { translation } = useContext(LanguageContext);
  const { setFilters, filters } = useContext(FilterContext);

  const validationSchema = useMemo(
    () => searchValidationSchema(translation),
    [translation]
  );

  const formik = useFormik<FormType>({
    initialValues: {
      search: filters?.[page]?.search,
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
  return (
    <div className="card">
      <div className="card-body">
        <MainFilters
          availableFilters={["search"]}
          {...formik}
          searchFiledName="search"
          searchLabel={translation.search}
        />
      </div>
    </div>
  );
};

export default Filters;
