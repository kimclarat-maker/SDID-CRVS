import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import toastMessage from "@/utils/common/toastMessage";
import CountryForm from "@/components/forms/geography/country";
import { CountryTypes } from "@/types/geography";
import { createCountry, updateCountry } from "@/api/geography/countries";

export default function AddCountry({
  handleClose,
  fetchData,
  selectedData,
}: {
  handleClose: () => void;
  fetchData?: () => void;
  selectedData?: CountryTypes;
}) {
  const { translation } = useContext(LanguageContext);

  const validationSchema = Yup.object({
    countryName: Yup.string()
      .required(translation.name_required)
      .typeError(translation.name_required),
    code: Yup.string()
      .required(translation.country_code_required)
      .typeError(translation.country_code_required),
    status: Yup.string()
      .required(translation.status_required)
      .typeError(translation.status_required),
  });

  const formik = useFormik<CountryTypes>({
    initialValues: {
      countryName: "",
      code: "",
      status: "active",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        if (selectedData && selectedData._id) {
          await updateCountry({
            _id: selectedData._id,
            countryName: values.countryName,
            code: values.code,
            status: values.status,
          });

          handleClose && handleClose();
          fetchData && fetchData();

          return;
        }

        await createCountry({
          countryName: values.countryName,
          code: values.code,
          status: values.status,
        });
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
        countryName: selectedData.name || "",
        code: selectedData.code || "",
        status: selectedData.status,
      });
    }
  }, [selectedData]);

  return <CountryForm {...formik} handleClose={handleClose} />;
}
