import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import toastMessage from "@/utils/common/toastMessage";
import { CenterType } from "@/types/Center";
import api from "@/api";
import OffdayForm from "@/components/forms/offday";

export default function AddCenter({
  handleClose,
  selectedData,
  fetchData,
  centerId,
  offdays,
}: {
  handleClose: () => void;
  selectedData?: CenterType;
  fetchData?: () => void;
  centerId: string;
  offdays: string[];
}) {
  const { translation } = useContext(LanguageContext);

  const validationSchema = Yup.object({
    offday: Yup.string()
      .required(translation.date_required)
      .typeError(translation.date_required),
  });

  const formik = useFormik<{ offday: string }>({
    initialValues: {
      offday: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        let method = "POST",
          url = `/configuration/centers/${centerId}/offday`,
          body = {
            offday: [...offdays, values.offday],
          };

        const options = {
          method,
          url,
          data: body,
        };

        const { data } = await api(options);
        toastMessage("success", data.message);
        handleClose && handleClose();
        fetchData && fetchData();
      } catch (error: any) {
        toastMessage("error", error);
      }
    },
  });

  useEffect(() => {
    if (selectedData && selectedData._id) {
      formik.setValues({
        offday: selectedData.offday,
      });
    }
  }, [selectedData]);

  useEffect(() => {
    if (offdays.includes(formik.values.offday)) {
      formik.setFieldError("offday", translation.data_exist);
    }
  }, [formik.values.offday]);

  return (
    <OffdayForm
      {...formik}
      handleClose={handleClose}
      selectedData={selectedData}
    />
  );
}
