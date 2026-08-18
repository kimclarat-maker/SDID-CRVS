import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useMemo } from "react";
import { useFormik } from "formik";
import toastMessage from "@/utils/common/toastMessage";
import errors from "@/constants/errors";
import { FilterContext } from "@/context/FilterContext";
import { searchValidationSchema } from "@/validation/filters.validation/filter.validation";
import MainFilters from "@/components/forms/filters/main";

interface FormType {
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
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
      province: filters?.[page]?.province,
      district: filters?.[page]?.district,
      sector: filters?.[page]?.sector,
      cell: filters?.[page]?.cell,
      village: filters?.[page]?.village,
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
          availableFilters={["search", "region", "center"]}
          {...formik}
          searchFiledName="search"
          searchLabel={translation.search}
        />
      </div>
    </div>
  );
};

export default Filters;
