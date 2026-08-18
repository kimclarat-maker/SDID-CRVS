import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import toastMessage from "@/utils/common/toastMessage";
import { VillageTypes } from "@/types/geography";
import { createVillages, updateVillages } from "@/api/geography/village";
import VillageForm from "@/components/forms/geography/village";

export default function AddCell({
  handleClose,
  fetchData,
  selectedData,
}: {
  handleClose: () => void;
  fetchData?: () => void;
  selectedData?: VillageTypes;
}) {
  const { translation } = useContext(LanguageContext);

  const validationSchema = Yup.object({
    name: Yup.string()
      .required(translation.name_required)
      .typeError(translation.name_required),
    provinceId: Yup.object()
      .required(translation.province_required)
      .typeError(translation.province_required),
    districtId: Yup.object()
      .required(translation.district_required)
      .typeError(translation.district_required),
    sectorId: Yup.object()
      .required(translation.sector_required)
      .typeError(translation.sector_required),
    cellId: Yup.object()
      .required(translation.cell_required)
      .typeError(translation.sector_required),
    status: Yup.string()
      .required(translation.status_required)
      .typeError(translation.status_required),
    code: Yup.string()
      .required(translation.code_required)
      .typeError(translation.code_required),
  });

  const formik = useFormik<VillageTypes>({
    initialValues: {
      name: "",
      provinceId: "",
      districtId: "",
      sectorId: "",
      status: "active",
      cellId: "",
      code: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        if (selectedData && selectedData._id) {
          const data = await updateVillages({
            _id: selectedData._id,
            name: values.name,
            provinceId: values.provinceId.code,
            districtId: values.districtId.code,
            sectorId: values.sectorId.code,
            cellId: values.cellId.code,
            status: values.status,
            code: values.code,
          });

          handleClose && handleClose();
          fetchData && fetchData();

          toastMessage("success", data.message);

          return;
        }

        const data = await createVillages({
          name: values.name,
          provinceId: values.provinceId.code,
          districtId: values.districtId.code,
          sectorId: values.sectorId.code,
          cellId: values.cellId.code,
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
        name: selectedData.name,
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
        cellId: {
          label: selectedData?.cellDetail?.name,
          value: selectedData?.cellDetail?.id,
          code: selectedData?.cellDetail?.code,
        },
        status: selectedData.status,
        code: selectedData.code,
      });
    }
  }, [selectedData]);

  return <VillageForm {...formik} handleClose={handleClose} />;
}
