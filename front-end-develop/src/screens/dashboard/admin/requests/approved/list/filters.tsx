import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect, useMemo } from "react";
import { useFormik } from "formik";
import toastMessage from "@/utils/common/toastMessage";
import errors from "@/constants/errors";
import { CenterType } from "@/types/Center";
import MainFilters from "@/components/forms/filters/main";
import { fetchEnrollments } from "@/api/enrollments";
import { useNavigate } from "react-router-dom";
import { searchValidationSchema } from "@/validation/filters.validation/filter.validation";

interface FormType {
  startDate: string;
  endDate: string;
  center: CenterType | null;
  search: string;
  preEnrollmentNo: string;
}

const Filters = ({
  filters = {},
  setFilters,
}: {
  filters: any;
  setFilters: (f: any) => void;
}) => {
  const { translation } = useContext(LanguageContext);
  const navigate = useNavigate();

  const validationSchema = useMemo(
    () => searchValidationSchema(translation),
    [translation]
  );

  const formik = useFormik<FormType>({
    initialValues: {
      startDate: filters.startDate || "",
      endDate: filters?.endDate || "",
      center: null,
      search: "",
      preEnrollmentNo: "",
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
        "firstName",
        "lastName",
        "fatherName",
        "motherName",
        "startDate",
        "endDate",
      ]}
      {...formik}
      searchFiledName="search"
      searchLabel={translation.enrollment_number}
      searchPlaceholder={translation.enter_enrollment_number}
      showSearchButton
    />
  );
};

export default Filters;
