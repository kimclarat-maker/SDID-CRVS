import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import toastMessage from "@/utils/common/toastMessage";
import SMSTemplateForm from "@/components/forms/configurations/smsTemplate";
import api from "@/api";
import { SMSTemplateTypes } from "@/types/SMS";

export default function Add({
  handleClose,
  selectedData,
  fetchData,
}: {
  handleClose: () => void;
  selectedData?: SMSTemplateTypes;
  fetchData?: () => void;
}) {
  const { translation } = useContext(LanguageContext);

  const validationSchema = Yup.object({
    flowId: Yup.object()
      .required(translation.flow_id_required)
      .typeError(translation.flow_id_required),
    smsSub: Yup.string()
      .required(translation.subject_required)
      .typeError(translation.subject_required),
    smsTextENG: Yup.string()
      .required(translation.message_required)
      .typeError(translation.message_required),
    smsTextFR: Yup.string()
      .required(translation.message_required)
      .typeError(translation.message_required),
    smsTextRW: Yup.string()
      .required(translation.message_required)
      .typeError(translation.message_required),
    effectiveDate: Yup.string()
      .required(translation.effective_date_required)
      .typeError(translation.effective_date_required),
  });

  const formik = useFormik<SMSTemplateTypes>({
    initialValues: {
      smsSub: "",
      smsTextENG: "",
      smsTextFR: "",
      smsTextRW: "",
      effectiveDate: "",
      flowId: null,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        let method = "POST",
          url = `/configuration/sms-templates`,
          body = {
            flowId: values?.flowId?.value || values.flowId,
            smsSub: values.smsSub,
            smsMultiLangText: {
              en: values.smsTextENG,
              fr: values.smsTextFR,
              rw: values.smsTextRW,
            },
            effectiveDate: values.effectiveDate,
          };

        if (selectedData && selectedData._id) {
          method = "PATCH";
          url = `/configuration/sms-templates/${selectedData._id}`;
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
        flowId: selectedData.flowId
          ? {
              label: selectedData.flowId,
              value: selectedData.flowId,
            }
          : null,
        smsSub: selectedData.smsSub,
        smsTextENG: selectedData?.smsMultiLangText?.en,
        smsTextFR: selectedData?.smsMultiLangText?.fr,
        smsTextRW: selectedData?.smsMultiLangText?.rw,
        effectiveDate: selectedData.effectiveDate,
      });
    }
  }, [selectedData]);

  return <SMSTemplateForm {...formik} handleClose={handleClose} />;
}
