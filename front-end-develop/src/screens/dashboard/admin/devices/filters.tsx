import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useMemo } from "react";
import { useFormik } from "formik";
import toastMessage from "@/utils/common/toastMessage";
import { searchValidationSchema } from "@/validation/filters.validation/filter.validation";
import MainFilters from "@/components/forms/filters/main";
import { useFetchAccounts } from "@/hooks/useAccounts";

interface SelectType {
  label: string;
  value: string;
}

interface FormType {
  deviceType: SelectType;
  assignmentStatus: SelectType;
  status: SelectType;
  account: string;
}

const Filters = ({
  setFilters,
  filters,
}: {
  setFilters: (f: any) => void;
  filters: any;
}) => {
  const { translation } = useContext(LanguageContext);
  const { fetchAccountData } = useFetchAccounts();

  const fetchAccounts = async (search: string) => {
    let params = {};

    if (!search) return;

    if (search?.includes("@") && search?.includes(".")) {
      params = {
        email: search,
      };
    } else if (Number(search) && search?.length >= 16) {
      params = {
        idNumber: search,
      };
    }
    return fetchAccountData({
      offset: 0,
      limit: 1,
      ...params,
    });
  };

  const validationSchema = useMemo(
    () => searchValidationSchema(translation),
    [translation]
  );

  const formik = useFormik<FormType>({
    initialValues: {
      deviceType: filters?.deviceType,
      status: filters?.status,
      assignmentStatus: filters?.assignmentStatus,
      account: filters?.account,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        if (values?.account) {
          const accounts = await fetchAccounts(values.account);

          if (accounts?.length === 0)
            return toastMessage("error", translation.account_not_found);

          setFilters((prev: any) => ({
            ...prev,
            ...values,
            accountId: values.account ? accounts[0]?._id : undefined,
          }));

          return;
        } else {
          setFilters((prev: any) => ({
            ...prev,
            ...values,
          }));
        }
      } catch (error) {
        toastMessage("error", error);
      }
    },
    enableReinitialize: true,
  });
  return (
    <MainFilters
      availableFilters={[
        // "center",
        "deviceType",
        "assignmentStatus",
        "accountId",
        "search",
      ]}
      {...formik}
      searchFiledName="serialNumber"
      showSearchButton
      searchLabel={translation.search}
      searchTextUpperCase
    />
  );
};

export default Filters;
