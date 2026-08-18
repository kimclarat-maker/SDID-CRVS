import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import toastMessage from "@/utils/common/toastMessage";
import EmailTemplateForm from "@/components/forms/configurations/emailTemplate";
import api from "@/api";
import { EmailTemplateTypes } from "@/types/Email";

export default function Add({
  handleClose,
  selectedData,
  fetchData,
}: {
  handleClose: () => void;
  selectedData?: EmailTemplateTypes;
  fetchData?: () => void;
}) {
  const { translation } = useContext(LanguageContext);

  const validationSchema = Yup.object({
    flowId: Yup.object()
      .required(translation.flow_id_required)
      .typeError(translation.flow_id_required),
    emailSubENG: Yup.string()
      .required(translation.subject_required)
      .typeError(translation.subject_required),
    emailSubFR: Yup.string()
      .required(translation.subject_required)
      .typeError(translation.subject_required),
    emailSubRW: Yup.string()
      .required(translation.subject_required)
      .typeError(translation.subject_required),
    emailTextENG: Yup.string()
      .required(translation.message_required)
      .typeError(translation.message_required),
    emailTextFR: Yup.string()
      .required(translation.message_required)
      .typeError(translation.message_required),
    emailTextRW: Yup.string()
      .required(translation.message_required)
      .typeError(translation.message_required),
    effectiveDate: Yup.string()
      .required(translation.effective_date_required)
      .typeError(translation.effective_date_required),
  });

  const formik = useFormik<EmailTemplateTypes>({
    initialValues: {
      emailSubENG: "",
      emailSubFR: "",
      emailSubRW: "",
      emailTextENG: "",
      emailTextFR: "",
      emailTextRW: "",
      effectiveDate: "",
      flowId: null,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        let method = "POST",
          url = `/configuration/email-templates`,
          body = {
            flowId: values.flowId?.value || values.flowId,
            emailMultiLangSub: {
              en: values.emailSubENG,
              fr: values.emailSubFR,
              rw: values.emailSubRW,
            },
            emailMultiLangText: {
              en: values.emailTextENG,
              fr: values.emailTextFR,
              rw: values.emailTextRW,
            },
            effectiveDate: values.effectiveDate,
          };

        if (selectedData && selectedData._id) {
          method = "PATCH";
          url = `/configuration/email-templates/${selectedData._id}`;
        }

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
    console.log({ selectedData });
    if (selectedData && selectedData._id) {
      formik.setValues({
        effectiveDate: selectedData.effectiveDate,
        emailSubENG: selectedData?.emailMultiLangSub?.en,
        emailSubFR: selectedData?.emailMultiLangSub?.fr,
        emailSubRW: selectedData?.emailMultiLangSub?.rw,
        emailTextENG: selectedData?.emailMultiLangText?.en,
        emailTextFR: selectedData?.emailMultiLangText?.fr,
        emailTextRW: selectedData?.emailMultiLangText?.rw,
        flowId: selectedData.flowId
          ? {
              label: selectedData.flowId,
              value: selectedData.flowId,
            }
          : null,
      });
    }
  }, [selectedData]);

  return <EmailTemplateForm {...formik} handleClose={handleClose} />;
}
