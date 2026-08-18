import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import toastMessage from "@/utils/common/toastMessage";
import { ProvinceTypes } from "@/types/geography";
import ProvinceForm from "@/components/forms/geography/province";
import { createProvince, updateProvince } from "@/api/geography/province";
import { useFetchCountryById } from "@/hooks/geography/useCountries";

export default function AddProvince({
  handleClose,
  fetchData,
  selectedData,
}: {
  handleClose: () => void;
  fetchData?: () => void;
  selectedData?: ProvinceTypes;
}) {
  const { translation } = useContext(LanguageContext);
  const { fetchCountryByIdData } = useFetchCountryById();

  const validationSchema = Yup.object({
    countryId: Yup.object()
      .required(translation.country_required)
      .typeError(translation.country_required),
    provinceName: Yup.string()
      .required(translation.name_required)
      .typeError(translation.name_required),
    status: Yup.string()
      .required(translation.status_required)
      .typeError(translation.status_required),
    code: Yup.string()
      .required(translation.code_required)
      .typeError(translation.code_required),
  });

  const formik = useFormik<ProvinceTypes>({
    initialValues: {
      countryId: "",
      provinceName: "",
      code: "",
      status: "active",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        if (selectedData && selectedData._id) {
          const data = await updateProvince({
            _id: selectedData._id,
            countryCode: values.countryId.code,
            provinceName: values.provinceName,
            status: values.status,
            code: values.code,
          });

          handleClose && handleClose();
          fetchData && fetchData();

          toastMessage("success", data.message);

          return;
        }

        const data = await createProvince({
          countryCode: values.countryId.code,
          provinceName: values.provinceName,
          status: values.status,
          code: values.code,
        });

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
      fetchCountryByIdData(selectedData.countryId).then((data) => {
        formik.setFieldValue("countryId", {
          label: data.name,
          value: data._id,
          code: data.code,
        });
      });
      formik.setValues({
        provinceName: selectedData.name,
        status: selectedData.status,
        code: selectedData.code,
      });
    }
  }, [selectedData]);

  return <ProvinceForm {...formik} handleClose={handleClose} />;
}
