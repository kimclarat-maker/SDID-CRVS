import { LanguageContext } from "@/context/LanguageContext";
import { useContext } from "react";
import axios from "axios";
import { useFormik } from "formik";
import * as Yup from "yup";
import toastMessage from "@/utils/common/toastMessage";
import DropdownMenuForm from "@/components/forms/accessRole/menus/add/dropdown";
import { cfg } from "@/constants/cfg";

export default function AddMenu({ handleClose }: { handleClose: () => void }) {
  const { translation } = useContext(LanguageContext);

  const validationSchema = Yup.object({
    menu: Yup.string().required(translation.menu_required),
  });

  const formik = useFormik<{ menu: string }>({
    initialValues: {
      menu: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        const options = {
          method: "POST",
          url: `${cfg.VITE_PUBLIC_API}/`,
          data: {
            menu: values.menu,
          },
        };

        await axios(options);
        onSuccess();
      } catch (error: any) {
        toastMessage("error", error);
      }
    },
  });

  const onSuccess = async () => {
    toastMessage("success", translation.data_added);
    handleClose && handleClose();
  };

  return <DropdownMenuForm {...formik} handleClose={handleClose} />;
}
