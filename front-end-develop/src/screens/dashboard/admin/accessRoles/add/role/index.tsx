import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import toastMessage from "@/utils/common/toastMessage";
import RoleForm from "@/components/forms/accessRole/roles";
import api from "@/api";
import { RoleType } from "@/types/ROLE";

export default function AddRole({
  handleClose,
  selectedData,
  fetchData,
}: {
  handleClose: () => void;
  selectedData?: RoleType;
  fetchData?: () => void;
}) {
  const { translation } = useContext(LanguageContext);

  const validationSchema = Yup.object({
    name: Yup.string()
      .required(translation.name_required)
      .typeError(translation.name_required),
    value: Yup.object()
      .required(translation.value_required)
      .typeError(translation.value_required),
    status: Yup.string()
      .required(translation.status_required)
      .typeError(translation.status_required),
  });

  const formik = useFormik<{ name: string; value?: any; status: string }>({
    initialValues: {
      name: "",
      value: null,
      status: "active",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        let method = "POST",
          url = `/configuration/roles`,
          body = {
            name: values.name,
            value: values?.value?.value,
            status: values.status,
          };

        if (selectedData && selectedData._id) {
          method = "PATCH";
          url = `/configuration/roles/${selectedData._id}`;
        }

        const options = {
          method,
          url,
          data: body,
        };

        const { data } = await api(options);
        onSuccess(data);
      } catch (error: any) {
        toastMessage("error", error);
      }
    },
  });

  useEffect(() => {
    if (selectedData && selectedData._id) {
      formik.setValues({
        name: selectedData.name,
        value: {
          label: selectedData.value,
          value: selectedData.value,
        },
        status: selectedData.status,
      });
    }
  }, [selectedData]);

  const onSuccess = async (data: any) => {
    toastMessage("success", data.message);
    handleClose && handleClose();
    fetchData && fetchData();
  };

  return <RoleForm {...formik} handleClose={handleClose} />;
}
