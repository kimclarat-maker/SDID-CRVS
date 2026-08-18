import { LanguageContext } from "@/context/LanguageContext";
import { useContext } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import toastMessage from "@/utils/common/toastMessage";
import AddMenuForm from "@/components/forms/accessRole/menus/add/menu";
import api from "@/api";
import { MenuType, RoleType } from "@/types/ROLE";

export default function AddMenu({
  handleClose,
  fetchData,
  selectedData,
}: {
  handleClose: () => void;
  fetchData: () => void;
  selectedData?: MenuType;
  loadingRoles: boolean;
  roles: RoleType[];
}) {
  const { translation } = useContext(LanguageContext);

  const validationSchema = Yup.object({
    name: Yup.string().required(translation.name_required),
  });

  const formik = useFormik<MenuType>({
    initialValues: {
      name: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        let method = "POST",
          url = `/configuration/menus`,
          body = {
            name: values.name,
            roleId: values.role,
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
        toastMessage("success", data.message);
        handleClose && handleClose();
        fetchData && fetchData();
      } catch (error: any) {
        toastMessage("error", error);
      }
    },
  });

  return <AddMenuForm {...formik} handleClose={handleClose} />;
}
