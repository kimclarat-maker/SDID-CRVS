import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useMemo } from "react";
import { useFormik } from "formik";
import toastMessage from "@/utils/common/toastMessage";
import errors from "@/constants/errors";
import { searchValidationSchema } from "@/validation/filters.validation/filter.validation";
import MainFilters from "@/components/forms/filters/main";
import { permissions } from "@/constants/permissions";

interface FormType {
  search: string;
  value: {
    label: string;
    value: string;
  };
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
      value: filters?.permission,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setFilters((prev: any) => ({
          ...prev,
          search: values?.search,
          value: values?.value?.value,
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
          availableFilters={["search", "permission"]}
          {...formik}
          searchFiledName="search"
          searchLabel={translation.search}
          showSearchButton
          permissions={permissions}
        />
      </div>
    </div>
  );
};

export default Filters;
