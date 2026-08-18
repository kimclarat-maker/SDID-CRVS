import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import toastMessage from "@/utils/common/toastMessage";
import api from "@/api";
import { HolidayType } from "@/types/Holidays";
import { getStorage } from "@/utils/storage";
import HolidayForm from "@/components/forms/holiday";

export default function Add({
  handleClose,
  selectedData,
  fetchData,
}: {
  handleClose: () => void;
  selectedData?: HolidayType;
  fetchData?: () => void;
}) {
  const { translation } = useContext(LanguageContext);

  const validationSchema = Yup.object({
    name: Yup.string()
      .required(translation.name_required)
      .typeError(translation.name_required),
    holidayDate: Yup.string()
      .required(translation.date_required)
      .typeError(translation.date_required),
  });

  const formik = useFormik<HolidayType>({
    initialValues: {
      name: "",
      holidayDate: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        const user = await getStorage();
        let method = "POST",
          url = `/configuration/holidays`,
          body = {
            name: values.name,
            holidayDate: values.holidayDate,
            postedBy: user.firstName + " " + user.lastName,
          };

        if (selectedData && selectedData._id) {
          method = "PATCH";
          url = `/configuration/holidays/${selectedData._id}`;
        }

        const options = {
          method,
          url,
          data: body,
        };

        const { data } = await api(options);
        // toastMessage("success", data.message);
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
        name: selectedData.name,
        holidayDate: selectedData.holidayDate,
      });
    }
  }, [selectedData]);

  return <HolidayForm {...formik} handleClose={handleClose} />;
}
