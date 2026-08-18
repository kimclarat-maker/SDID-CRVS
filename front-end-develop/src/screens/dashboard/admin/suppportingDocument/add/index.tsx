import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import toastMessage from "@/utils/common/toastMessage";
import api from "@/api";
import { SupportingDocumentTypes } from "@/types/SupportingDocument";
import SupportingDocumentForm from "@/components/forms/supportingDocument";

export default function Add({
  handleClose,
  getData,
  selectedData,
}: {
  handleClose: () => void;
  getData: () => void;
  selectedData?: SupportingDocumentTypes;
}) {
  const { translation } = useContext(LanguageContext);

  const validationSchema = Yup.object({
    fieldNames: Yup.array().required(translation.field_name_required),
    engName: Yup.string().required(translation.name_required),
    rwName: Yup.string().required(translation.name_required),
    frName: Yup.string().required(translation.name_required),
    documentTypesMultiLang: Yup.array()
      .required(translation.document_type_required)
      .typeError(translation.document_type_required),

    allowedFormats: Yup.array()
      .required(translation.allowed_supporting_formats_required)
      .typeError(translation.allowed_supporting_formats_required),
  });

  const formik = useFormik<SupportingDocumentTypes>({
    initialValues: {
      isRequired: true,
      documentTypes: [],
      allowedFormats: [],
      fieldNames: [],
      documentTypesMultiLang: [{ en: "", fr: "", rw: "" }],
      engName: "",
      rwName: "",
      frName: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        let method = "POST",
          url = `/configuration/supporting-documents`,
          body = {
            fieldNames: values.fieldNames?.map((el: any) => el.value),
            name: {
              en: values.engName,
              fr: values.frName,
              rw: values.rwName,
            },
            allowedFormats: values.allowedFormats?.map((el: any) => el.value),
            isRequired: values.isRequired,
            documentTypesMultiLang: values.documentTypesMultiLang,
          };

        if (selectedData && selectedData._id) {
          method = "PATCH";
          url = `/configuration/supporting-documents/${selectedData._id}`;
        }

        const options = {
          method,
          url,
          data: body,
        };

        const { data } = await api(options);

        toastMessage("success", data.message);
        handleClose && handleClose();
        getData && getData();
      } catch (error: any) {
        toastMessage("error", error);
      }
    },
  });

  useEffect(() => {
    if (selectedData) {
      formik.setValues({
        fieldNames: selectedData.fieldNames
          ? selectedData?.fieldNames?.map((el: any) => {
              return {
                label: el,
                value: el,
              };
            })
          : [],
        allowedFormats:
          selectedData?.allowedFormats?.map((el) => {
            return {
              label: el,
              value: el,
            };
          }) || [],
        documentTypes:
          selectedData?.documentTypes?.map((el) => {
            return {
              label: el,
              value: el,
            };
          }) || [],
        isRequired: selectedData.isRequired,
        rwName: selectedData?.name?.rw || "",
        engName: selectedData?.name?.en || "",
        frName: selectedData?.name?.fr || "",
        documentTypesMultiLang: selectedData.documentTypesMultiLang,
      });
    }
  }, [selectedData]);

  return (
    <SupportingDocumentForm
      {...formik}
      handleClose={handleClose}
      selectedData={selectedData}
    />
  );
}
