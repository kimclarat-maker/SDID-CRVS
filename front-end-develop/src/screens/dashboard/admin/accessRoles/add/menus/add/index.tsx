import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import toastMessage from "@/utils/common/toastMessage";
import AddMenuForm from "@/components/forms/accessRole/menus/add/menu";
import { MenuType, RoleType } from "@/types/ROLE";
import api from "@/api";

export default function AddMenu({
  handleClose,
  selectedData,
  fetchData,
}: {
  handleClose: () => void;
  selectedData?: MenuType;
  fetchData: () => void;
}) {
  const { translation } = useContext(LanguageContext);

  const validationSchema = Yup.object({
    name: Yup.string()
      .required(translation.name_required)
      .typeError(translation.name_required),
    status: Yup.string()
      .required(translation.status_required)
      .typeError(translation.status_required),
  });

  const formik = useFormik<{
    name: string;
    accessRoles: RoleType[];
    status: string;
  }>({
    initialValues: {
      name: "",
      accessRoles: [],
      status: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        let method = "POST",
          url = `/configuration/menus`,
          body = {
            name: values.name,
            accessRoles: values.accessRoles,
            status: values.status,
          };

        if (selectedData && selectedData._id) {
          method = "PATCH";
          url = `/configuration/menus/${selectedData._id}`;
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
        accessRoles: selectedData?.accessRoles || [],
        status: selectedData?.status,
      });
    }
  }, [selectedData]);

  const onSuccess = async (data: any) => {
    toastMessage("success", data.message);
    handleClose && handleClose();
    fetchData && fetchData();
  };

  return <AddMenuForm {...formik} handleClose={handleClose} />;
}
