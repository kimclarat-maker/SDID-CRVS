import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import toastMessage from "@/utils/common/toastMessage";
import { CenterType } from "@/types/Center";
import CenterForm from "@/components/forms/center";
import api from "@/api";
import { replaceDialCode } from "@/utils/common/replaceDialCode";
import { addCenter, updateCenter } from "@/api/centers";

export default function AddCenter({
  handleClose,
  selectedData,
  fetchData,
}: {
  handleClose: () => void;
  selectedData?: CenterType;
  fetchData?: () => void;
}) {
  const { translation } = useContext(LanguageContext);

  const validationSchema = Yup.object({
    name: Yup.string()
      .required(translation.center_required)
      .typeError(translation.center_required),
    country: Yup.object()
      .required(translation.country_required)
      .typeError(translation.country_required),
    latitude: Yup.string()
      .required(translation.field_required)
      .typeError(translation.field_required),
    longitude: Yup.string()
      .required(translation.field_required)
      .typeError(translation.field_required),
    status: Yup.string()
      .required(translation.status_required)
      .typeError(translation.status_required),

    contactNumber: Yup.string()
      .required(translation.phone_number_required)
      .typeError(translation.phone_number_required),

    capacityPerSlotOperator: Yup.string()
      .required(translation.field_required)
      .typeError(translation.field_required),
    availableOperators: Yup.string()
      .required(translation.field_required)
      .typeError(translation.field_required),
    level: Yup.object()
      .required(translation.field_required)
      .typeError(translation.field_required),
  });

  const formik = useFormik<CenterType>({
    initialValues: {
      name: "",
      country: null,
      province: null,
      district: null,
      sector: null,
      cell: null,
      village: "",
      latitude: null,
      longitude: null,
      status: "active",
      contactNumber: "",
      capacityPerSlotOperator: "",
      availableOperators: "",
      level: null,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        let resposeData: any,
          dialCode = values.phoneCountry ? values.phoneCountry.value : "+250",
          body = {
            name: values.name,
            province: values?.province?.code,
            district: values.district?.code,
            sector: values.sector?.code,
            cell: values.cell?.code,
            village: values.village?.code,
            latitude: parseFloat(values.latitude),
            longitude: parseFloat(values.longitude),
            status: values.status,
            country: values.country?.code,
            level: { value: values?.level?.label, key: values?.level?.value },
            types: [{ key: "enrollment", value: "Enrollment" }],
            contactNumber:
              values?.contactNumber && values?.contactNumber?.length < 9
                ? values.contactNumber
                : dialCode + "" + values.contactNumber,

            capacityPerSlotOperator: parseInt(values.capacityPerSlotOperator),
            availableOperators: parseInt(values.availableOperators),
          };

        if (selectedData && selectedData._id) {
          resposeData = await updateCenter(selectedData._id, body);
        } else {
          resposeData = await addCenter(body);
        }
        toastMessage("success", resposeData.message);

        handleClose && handleClose();
        fetchData && fetchData();
      } catch (error: any) {
        console.log(error);
        toastMessage("error", error);
      }
    },
    validateOnMount: false, // Prevent validation on initial render
    validateOnChange: true, // Validate when fields change (optional, set to false if you only want validation on submit or blur)
  });

  useEffect(() => {
    console.log(selectedData);
    if (selectedData && selectedData._id) {
      let contactNumber = selectedData.contactNumber;

      if (selectedData && selectedData.contactNumber) {
        let formatePhone = replaceDialCode(
          selectedData.contactNumber.startsWith("0")
            ? selectedData.contactNumber.slice(1)
            : selectedData.contactNumber
        );

        contactNumber = formatePhone;
      }

      formik.setValues({
        country: {
          _id: selectedData.countryDetail?.id,
          value: selectedData.countryDetail?.id,
          name: selectedData.countryDetail?.name,
          label: selectedData.countryDetail?.name,
          code: selectedData.countryDetail?.code,
        },
        name: selectedData.name,
        province: selectedData?.provinceDetail?.id
          ? {
              ...selectedData?.provinceDetail,
              label: selectedData?.provinceDetail.name,
              value: selectedData?.provinceDetail.id,
            }
          : null,
        district: selectedData?.districtDetail?.id
          ? {
              ...selectedData?.districtDetail,
              label: selectedData?.districtDetail.name,
              value: selectedData?.districtDetail.id,
            }
          : null,
        sector: selectedData?.sectorDetail?.id
          ? {
              ...selectedData?.sectorDetail,
              label: selectedData?.sectorDetail.name,
              value: selectedData?.sectorDetail.id,
            }
          : null,
        cell: selectedData?.cellDetail?.id
          ? {
              ...selectedData?.cellDetail,
              label: selectedData?.cellDetail.name,
              value: selectedData?.cellDetail.id,
            }
          : null,
        village: selectedData?.villageDetail?.id
          ? {
              ...selectedData?.villageDetail,
              label: selectedData?.villageDetail.name,
              value: selectedData?.villageDetail?.id,
            }
          : null,
        latitude: parseFloat(selectedData.latitude),
        longitude: parseFloat(selectedData.longitude),
        status: selectedData.status,
        contactNumber: contactNumber,
        capacityPerSlotOperator: selectedData.capacityPerSlotOperator,
        availableOperators: selectedData.availableOperators,
        level: selectedData?.centerLevel
          ? {
              value: selectedData?.centerLevel,
              label: selectedData?.centerLevelName,
            }
          : null,
        types:
          selectedData?.centerTypeDetail?.length > 0
            ? selectedData?.centerTypeDetail?.map((el: any) => {
                return {
                  ...el,
                  label: el.key,
                  value: el.value,
                };
              })
            : null,
      });
    }
  }, [selectedData]);

  useEffect(() => {
    if (formik.values.contactNumber?.startsWith("0")) {
      // Remove the leading '0' from the phone number
      const updatedPhoneNumber = formik.values.contactNumber.slice(1);
      formik.setFieldValue("contactNumber", updatedPhoneNumber); // Update the formik value
    }
  }, [formik.values.contactNumber]);

  return (
    <CenterForm
      {...formik}
      handleClose={handleClose}
      selectedData={selectedData}
    />
  );
}
