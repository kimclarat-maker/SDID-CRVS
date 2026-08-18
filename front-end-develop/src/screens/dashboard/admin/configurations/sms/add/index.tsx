import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import toastMessage from "@/utils/common/toastMessage";
import { SMSType } from "@/types/Configuration";
import SmsForm from "@/components/forms/configurations/sms";
import api from "@/api";
import { getStorage } from "@/utils/storage";

export default function AddSMS({
  handleClose,
  selectedData,
  fetchData
}: {
  handleClose: () => void;
  selectedData?: SMSType;
  fetchData?: () => void;
}) {
  const { translation } = useContext(LanguageContext);

  const validationSchema = Yup.object({
    smsProvider: Yup.object()
      .required(translation.sms_provider_required)
      .typeError(translation.sms_provider_required),
    scope: Yup.string()
      .required(translation.scope_required)
      .typeError(translation.scope_required),
    status: Yup.string()
      .required(translation.status_required)
      .typeError(translation.status_required)
    // apiKey: Yup.string()
    //   .required(translation.api_key_required)
    //   .typeError(translation.api_key_required),
  });

  const formik = useFormik<SMSType>({
    initialValues: {
      email: "",
      apiKey: "",
      serviceId: "",
      mobileServiceId: "",
      username: "",
      effectiveDate: "",
      status: "",
      smsProvider: "",
      scope: "local",
      baseUrl: ""
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        let user = await getStorage();
        let method = "POST",
          url = `/configuration/sms-settings`,
          body: any = {
            email: values.email,
            apiKey: values.apiKey,
            serviceId: values.serviceId,
            mobileServiceId: values.mobileServiceId,
            postedBy: user.firstName + " " + user.lastName,
            effectiveDate: values.effectiveDate,
            username: values.username,
            status: values.status,
            smsProvider: values.smsProvider?.value || values.smsProvider,
            scope: values.scope,
            baseUrl: values.baseUrl
          };

        if (selectedData && selectedData._id) {
          method = "PATCH";
          url = `/configuration/sms-settings/${selectedData._id}`;

          body.modifiedBy = user.firstName + " " + user.lastName;
        }

        const options = {
          method,
          url,
          data: body
        };

        const { data } = await api(options);
        toastMessage("success", data.message);
        handleClose && handleClose();
        fetchData && fetchData();
      } catch (error: any) {
        toastMessage("error", error);
      }
    }
  });

  useEffect(() => {
    if (selectedData && selectedData._id) {
      formik.setValues({
        email: selectedData.email,
        apiKey: selectedData.apiKey,
        serviceId: selectedData.serviceId,
        mobileServiceId: selectedData.mobileServiceId,
        username: selectedData.username,
        effectiveDate: selectedData.effectiveDate,
        scope: selectedData.scope,
        smsProvider: selectedData.smsProvider
          ? {
              label: selectedData.smsProvider,
              value: selectedData.smsProvider
            }
          : null,
        status: selectedData.status,
        baseUrl: selectedData.baseUrl
      });
    }
  }, [selectedData]);

  return <SmsForm {...formik} handleClose={handleClose} />;
}
