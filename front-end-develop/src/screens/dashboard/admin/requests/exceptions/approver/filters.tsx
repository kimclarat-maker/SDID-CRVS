import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect, useMemo } from "react";
import { useFormik } from "formik";
import toastMessage from "@/utils/common/toastMessage";
import errors from "@/constants/errors";
import { CenterType } from "@/types/Center";
import MainFilters from "@/components/forms/filters/main";
import { searchValidationSchema } from "@/validation/filters.validation/filter.validation";

interface FormType {
  startDate: string;
  endDate: string;
  center: CenterType | null;
  enrollmentStatus: string;
  search: string;
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
      search: "",
      startDate: filters?.startDate || "",
      endDate: filters?.endDate || "",
      center: null,
      enrollmentStatus: filters?.enrollmentStatus,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setFilters((prev: any) => ({
          ...prev,
          ...values,
          offset: 0,
          limit: 10,
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
        //  "date"
        "fatherName",
        "motherName",
        "firstName",
        "lastName",
        "approverSelfieSkipStatuses",
        "startDate",
        "endDate",
      ]}
      {...formik}
      searchFiledName="search"
      searchLabel={translation.search_by_prenrollment_number}
      searchPlaceholder={translation.prenrollment_number}
      showSearchButton
      statuses={[
        { label: translation.pending, value: "PENDING" },
        { label: translation.approved, value: "APPROVED" },
        { label: translation.rejected, value: "REJECTED" },
      ]}
    />
  );
};

export default Filters;
