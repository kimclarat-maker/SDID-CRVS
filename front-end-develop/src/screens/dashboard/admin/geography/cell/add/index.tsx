import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import toastMessage from "@/utils/common/toastMessage";
import { CellTypes } from "@/types/geography";
import { createCell, updateCell } from "@/api/geography/cell";
import CellForm from "@/components/forms/geography/cell";

export default function AddCell({
  handleClose,
  fetchData,
  selectedData,
}: {
  handleClose: () => void;
  fetchData?: () => void;
  selectedData?: CellTypes;
}) {
  const { translation } = useContext(LanguageContext);

  const validationSchema = Yup.object({
    name: Yup.string()
      .required(translation.name_required)
      .typeError(translation.name_required),
    // provinceId: Yup.object()
    //   .required(translation.province_required)
    //   .typeError(translation.province_required),
    // districtId: Yup.object()
    //   .required(translation.district_required)
    //   .typeError(translation.district_required),
    // sectorId: Yup.object()
    //   .required(translation.sector_required)
    //   .typeError(translation.sector_required),
    status: Yup.string()
      .required(translation.status_required)
      .typeError(translation.status_required),
    code: Yup.string()
      .required(translation.code_required)
      .typeError(translation.code_required),
  });

  const formik = useFormik<CellTypes>({
    initialValues: {
      name: "",
      provinceId: "",
      districtId: "",
      sectorId: "",
      status: "active",
      code: "active",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        if (selectedData && selectedData._id) {
          const data = await updateCell({
            _id: selectedData._id,
            name: values.name,
            provinceId: values.provinceId.code,
            districtId: values.districtId.code,
            sectorId: values.sectorId.code,
            status: values.status,
            code: values.code,
          });

          handleClose && handleClose();
          fetchData && fetchData();

          toastMessage("success", data.message);

          return;
        }

        const data = await createCell({
          name: values.name,
          provinceId: values.provinceId.code,
          districtId: values.districtId.code,
          sectorId: values.sectorId.code,
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
        districtId: {
          label: selectedData?.districtDetail?.name,
          value: selectedData?.districtDetail?.id,
          code: selectedData?.districtDetail?.code,
        },
        sectorId: {
          label: selectedData?.sectorDetail?.name,
          value: selectedData?.sectorDetail?.id,
          code: selectedData?.sectorDetail?.code,
        },
        name: selectedData.name,
        status: selectedData.status,
        code: selectedData.code,
      });
    }
  }, [selectedData]);

  return <CellForm {...formik} handleClose={handleClose} />;
}
