import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import toastMessage from "@/utils/common/toastMessage";
import api from "@/api";
import { RoleType } from "@/types/ROLE";
import AccessRightForm from "@/components/forms/accessRole/accessRights";

interface AddAccessRightProps {
  handleClose: () => void;
  selectedData?: RoleType;
  fetchData?: () => void;
  defaultRole?: RoleType;
}

export default function AddAccessRight({
  handleClose,
  selectedData,
  fetchData,
  defaultRole,
}: AddAccessRightProps) {
  const { translation } = useContext(LanguageContext);

  // Validation schema
  const validationSchema = Yup.object({
    roleId: Yup.object()
      .required(translation.role_required)
      .typeError(translation.role_required),
    permissions: Yup.array()
      .required(translation.permissions_required)
      .typeError(translation.permissions_required),
  });

  // Formik initialization
  const formik = useFormik<{
    roleId: {
      label: string;
      value: string;
    } | null;
    permissions: any;
    module?: {
      label: string;
      value: string;
    } | null;
    modifyPermission?: any;
  }>({
    initialValues: {
      roleId: null, // Set initial roleId to null
      permissions: {},
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        const { data } = await api({
          method: "POST",
          url: "/configuration/access-rights",
          data: {
            roleId: values.roleId?.value || values.roleId,
            permissions: values.permissions,
          },
        });
        onSuccess(data);
      } catch (error: any) {
        toastMessage("error", error.message || "An error occurred");
      }
    },
  });

  // Set form values when selectedData changes
  useEffect(() => {
    if (selectedData?._id) {
      formik.setValues({
        roleId: selectedData.role
          ? {
              label: selectedData.role?.name,
              value: selectedData.role?._id,
            }
          : null,
        module: selectedData.module
          ? {
              label: selectedData.module,
              value: selectedData.module,
            }
          : null,
        modifyPermission: {
          delete: selectedData.delete,
          get: selectedData.get,
          post: selectedData.post,
          update: selectedData.update,
        },
        permissions: [
          {
            delete: selectedData.delete,
            get: selectedData.get,
            post: selectedData.post,
            update: selectedData.update,
            module: selectedData.module,
          },
        ],
      });
    }
  }, [selectedData]);

  // Set defaultRole value when component mounts
  useEffect(() => {
    if (defaultRole?._id) {
      formik.setFieldValue("roleId", defaultRole._id); // Set roleId to the _id of defaultRole
    }
  }, [defaultRole]);

  // Handle success
  const onSuccess = async (data: any) => {
    toastMessage("success", data.message);
    handleClose?.();
    fetchData?.();
  };

  return <AccessRightForm {...formik} handleClose={handleClose} />;
}
