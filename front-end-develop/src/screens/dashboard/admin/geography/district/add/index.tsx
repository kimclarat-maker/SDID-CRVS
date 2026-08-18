import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import toastMessage from "@/utils/common/toastMessage";
import { DistrictTypes } from "@/types/geography";
import { createDistrict, updateDistrict } from "@/api/geography/district";
import DistrictForm from "@/components/forms/geography/district";

export default function AddDistrict({
  handleClose,
  fetchData,
  selectedData,
}: {
  handleClose: () => void;
  fetchData?: () => void;
  selectedData?: DistrictTypes;
}) {
  const { translation } = useContext(LanguageContext);

  const validationSchema = Yup.object({
    provinceId: Yup.object()
      .required(translation.province_required)
      .typeError(translation.province_required),
    name: Yup.string()
      .required(translation.name_required)
      .typeError(translation.name_required),
    status: Yup.string()
      .required(translation.status_required)
      .typeError(translation.status_required),
    code: Yup.string()
      .required(translation.code_required)
      .typeError(translation.code_required),
  });

  const formik = useFormik<DistrictTypes>({
    initialValues: {
      name: "",
      status: "",
      provinceId: "",
      code: "",
      countryId: null,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        if (selectedData && selectedData._id) {
          await updateDistrict({
            _id: selectedData._id,
            provinceCode: values.provinceId.code,
            name: values.name,
            status: values.status,
            code: values.code,
          });

          handleClose && handleClose();
          fetchData && fetchData();

          return;
        }

        await createDistrict({
          provinceCode: values.provinceId.code,
          name: values.name,
          status: values.status,
          code: values.code,
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
        countryId: {
          label: selectedData?.countryDetail?.name,
          value: selectedData?.countryDetail?.id,
          code: selectedData?.countryDetail?.code,
        },
        provinceId: {
          label: selectedData?.provinceDetail?.name,
          value: selectedData?.provinceDetail?.id,
          code: selectedData?.provinceDetail?.code,
        },
        name: selectedData.name,
        status: selectedData.status,
        code: selectedData.code,
      });
    }
  }, [selectedData]);

  return <DistrictForm {...formik} handleClose={handleClose} />;
}
