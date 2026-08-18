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
  startDate: string | undefined;
  endDate: string | undefined;
  center: CenterType | undefined;
  enrollmentStatus: string;
  preEnrollmentNo?: string;
}

const Filters = ({
  filters,
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
      startDate: undefined,
      endDate: undefined,
      center: undefined,
      enrollmentStatus: filters?.enrollmentStatus,
      preEnrollmentNo: undefined,
    },
    validationSchema,
    onSubmit: async (values: any) => {
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
        "endDate",
        "startDate",
        "fatherName",
        "motherName",
        "firstName",
        "lastName",
        "preEnrollmentNo",
      ]}
      {...formik}
      searchFiledName="preEnrollmentNo"
      searchLabel={translation.search_by_prenrollment_number}
      searchPlaceholder={translation.enter_id_number}
      showSearchButton
    />
  );
};

export default Filters;
