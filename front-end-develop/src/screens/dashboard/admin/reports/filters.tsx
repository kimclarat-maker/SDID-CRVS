import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useMemo } from "react";
import { useFormik } from "formik";
import { analyticsValidationSchema } from "@/validation/filters.validation/analytics.validation";
import toastMessage from "@/utils/common/toastMessage";
import errors from "@/constants/errors";
import AnalyticFilters from "@/components/forms/filters/main";

interface FormType {
  startDate: string;
  endDate: string;
  country: any;
  province: any;
  district: any;
  sector: any;
  cell: any;
  village: any;
  bottomContent?: React.ReactNode;
}

const Filters = ({
  filters,
  setFilters,
  fields,
  loading,
  bottomContent,
}: {
  filters: any;
  setFilters: (f: any) => void;
  fields?: string[];
  loading?: boolean;
  bottomContent?: React.ReactNode;
}) => {
  const { translation } = useContext(LanguageContext);

  const validationSchema = useMemo(
    () => analyticsValidationSchema(translation),
    [translation]
  );

  const formik = useFormik<FormType>({
    initialValues: {
      startDate: filters?.startDate,
      endDate: filters?.endDate,
      country: null,
      province: null,
      district: null,
      sector: null,
      cell: null,
      village: null,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setFilters((prev: any) => ({
          ...prev,
          ...values,
        }));

        const params = {
          startDate: values.startDate,
          endDate: values.endDate,
          country: values?.country?.code,
          province: values?.province?.code,
          district: values?.district?.code,
          sector: values?.sector?.code,
          cell: values?.cell?.code,
          village: values?.village?.code,
        };

        setFilters((prev: any) => ({
          ...prev,
          ...params,
        }));
      } catch (error) {
        toastMessage("error", errors(translation.default, error)["002"]);
      }
    },
    enableReinitialize: true,
  });

  return (
    <AnalyticFilters
      {...formik}
      availableFilters={["startDate", "endDate", "region"]}
      showSearchButton
      fields={fields}
      bottomContent={bottomContent}
      loading={loading}
    />
  );
};

export default Filters;
