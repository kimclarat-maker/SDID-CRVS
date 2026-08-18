import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import toastMessage from "@/utils/common/toastMessage";
import EmailForm from "@/components/forms/configurations/email";
import { EmailType } from "@/types/Configuration";
import api from "@/api";
import { getStorage } from "@/utils/storage";
import moment from "moment";

export default function AddEmail({
  handleClose,
  selectedData,
  fetchData,
}: {
  handleClose: () => void;
  selectedData?: EmailType;
  fetchData?: () => void;
}) {
  const { translation } = useContext(LanguageContext);

  const validationSchema = Yup.object({
    fromAddress: Yup.string().required(translation.email_address_required),
    smtpAddress: Yup.string()
      .required(translation.smtp_address_required)
      .typeError(translation.password_required),
    username: Yup.string()
      .required(translation.smtp_user_name_required)
      .typeError(translation.password_required),
    smtpPort: Yup.string()
      .required(translation.smtp_port_address_required)
      .typeError(translation.password_required),
    smtpPassword: Yup.string()
      .required(translation.password_required)
      .typeError(translation.password_required),
    effectiveDate: Yup.string()
      .required(translation.date_required)
      .typeError(translation.date_required),
    sslEnable: Yup.boolean()
      .required(translation.ssl_enabled_required)
      .typeError(translation.ssl_enabled_required),
    status: Yup.string()
      .required(translation.status_required)
      .typeError(translation.status_required),
  });

  const formik = useFormik<EmailType>({
    initialValues: {
      username: "",
      fromAddress: "",
      smtpAddress: "",
      smtpPort: "",
      smtpPassword: "",
      effectiveDate: "",
      sslEnable: false,
      status: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        let user = await getStorage();
        let method = "POST",
          url = `/configuration/email-settings`,
          body: any = {
            username: values.username,
            fromAddress: values.fromAddress,
            smtpAddress: values.smtpAddress,
            sslEnable: values.sslEnable,
            smtpPort: parseFloat(values.smtpPort),
            smtpPassword: values.smtpPassword,
            effectiveDate: values.effectiveDate,
            status: values.status,
            postedBy: user.firstName + " " + user.lastName,
          };

        if (selectedData && selectedData._id) {
          method = "PATCH";
          url = `/configuration/email-settings/${selectedData._id}`;

          delete body.postedBy;

          body.modifiedBy = user.firstName + " " + user.lastName;
        }

        const options = {
          method,
          url,
          data: body,
        };

        await api(options);
        fetchData && fetchData();
        handleClose && handleClose();
      } catch (error: any) {
        toastMessage("error", error);
      }
    },
  });

  useEffect(() => {
    if (selectedData && selectedData._id) {
      formik.setValues({
        username: selectedData.username,
        fromAddress: selectedData.fromAddress,
        smtpAddress: selectedData.smtpAddress,
        sslEnable: selectedData.sslEnable === 1 ? true : false,
        smtpPort: selectedData.smtpPort,
        smtpPassword: selectedData.smtpPassword,
        status: selectedData.status,
        effectiveDate: moment(selectedData.effectiveDate).format("YYYY-MM-DD"),
      });
    }
  }, [selectedData]);

  return <EmailForm {...formik} handleClose={handleClose} />;
}
