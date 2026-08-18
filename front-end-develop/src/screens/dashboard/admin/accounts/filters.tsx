import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useMemo } from "react";
import { useFormik } from "formik";
import toastMessage from "@/utils/common/toastMessage";
import errors from "@/constants/errors";
import { searchValidationSchema } from "@/validation/filters.validation/filter.account.validation";
import MainFilters from "@/components/forms/filters/main";

interface FormType {
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  center: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  idNumber: string;
}

const Filters = ({
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
      province: filters?.province,
      district: filters?.district,
      sector: filters?.sector,
      cell: filters?.cell,
      village: filters?.village,
      center: filters?.center,
      firstName: filters?.firstName,
      lastName: filters?.lastName,
      email: filters?.email,
      phoneNumber: filters?.phoneNumber,
      idNumber: filters?.idNumber,
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
        "center",
        "firstName",
        "lastName",
        "email",
        "phoneNumber",
        "idNumber",
      ]}
      {...formik}
      searchFiledName="search"
      searchLabel={translation.search}
      showSearchButton
    />
  );
};

export default Filters;
