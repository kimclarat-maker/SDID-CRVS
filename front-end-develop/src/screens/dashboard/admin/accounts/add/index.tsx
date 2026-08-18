import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import toastMessage from "@/utils/common/toastMessage";
import { AccountType } from "@/types/Account";
import AccountForm from "@/components/forms/account";
import api from "@/api";
import { useUploadMedia } from "@/hooks/useUploadMedia";

type SupportingDocumentType = {
  name: string;
  _id: string;
};

export default function AddAccount({
  handleClose,
  selectedData,
  fetchData,
}: {
  handleClose: () => void;
  selectedData?: AccountType;
  fetchData: () => void;
}) {
  const { translation } = useContext(LanguageContext);
  const { loadingUpload, handleUploadMedia } = useUploadMedia();
  const [supportingDocuments, setSupportingDocuments] = useState<
    SupportingDocumentType[]
  >([]);

  const validationSchema = Yup.object({
    email: Yup.string()
      .email(translation.invalid_email)
      .required(translation.email_address_required)
      .test("has-dot-in-domain", translation.invalid_email, (value) => {
        // Split on @ and check if domain has a dot
        const parts = value.split("@");
        return parts.length === 2 && parts[1].includes(".");
      }),
    phoneNumber: Yup.string().required(translation.phone_number_required),
    idNumber: Yup.string()
      .test("starts-with-type-prefix", function (value) {
        const { type } = this.parent; // Access the current `type` value in the form

        // Validate if the `documentIdentificationNumber` starts with `type.startWith`
        if (value && !value?.startsWith("1")) {
          return this.createError({
            path: "idNumber",
            message: `${translation.invalid_id_number}`,
          });
        }

        return true; // Pass validation if all checks are satisfied
      })
      .min(16, translation.invalid_id_number)
      .required(translation.id_number_required),
    password: Yup.string()
      .min(8, translation.password_length)
      .when([], {
        is: () => !selectedData || !selectedData._id,
        then: (schema) => schema.required(translation.password_required),
        otherwise: (schema) => schema,
      }),
    accessRole: Yup.object()
      .required(translation.access_role_required)
      .typeError(translation.access_role_required),
  });

  const formik = useFormik<AccountType>({
    initialValues: {
      email: "",
      password: "",
      phoneNumber: "",
      firstName: "",
      lastName: "",
      center: null,
      accessRole: "",
      status: "active",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        let method = "POST",
          url = `/accounts`,
          body: any = {
            idNumber: values.idNumber,
            photo: values.photo,
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            password: values.password,
            phoneNumber: values.phoneNumber,
            centerId:
              values?.accessRole.level?.toUpperCase() !== "SUPERADMIN" &&
              values?.center?.value
                ? values?.center?.value
                : "",
            accessRoleId: values.accessRole?.value,
            status: values.status,
            supportingDocuments,
          };

        if (selectedData && selectedData._id) {
          delete body.password;

          method = "PATCH";
          url = `/accounts/${selectedData._id}`;
        }

        if (method === "POST" && body.centerId === "") {
          delete body.centerId;
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

  const onSuccess = async (data: any) => {
    toastMessage("success", data.message);

    handleClose && handleClose();
    fetchData();
  };

  useEffect(() => {
    if (selectedData && selectedData._id) {
      const newSupportingDocuments = [...supportingDocuments];

      if (
        selectedData.supportingDocuments &&
        selectedData?.supportingDocuments?.length > 0
      ) {
        for (let el of selectedData.supportingDocuments) {
          if (
            newSupportingDocuments.findIndex((fEl) => fEl._id === el.id) === -1
          ) {
            newSupportingDocuments.push({
              name: el.name,
              _id: el.id,
            });
          }
        }
      }

      formik.setValues({
        accountId: selectedData._id,
        idNumber: selectedData.idNumber,
        firstName: selectedData.firstName,
        isUpdateEnabled: true,
        lastName: selectedData.lastName,
        email: selectedData.email,
        phoneNumber: selectedData?.phoneNumber,
        country:
          selectedData?.center && selectedData?.center?.countryDetail
            ? {
                label: selectedData?.center?.countryDetail.name,
                value: selectedData?.center?.countryDetail.id,
                code: selectedData?.center?.countryDetail.code,
              }
            : null,

        province:
          selectedData?.center && selectedData?.center?.provinceDetail
            ? {
                label: selectedData?.center?.provinceDetail.name,
                value: selectedData?.center?.provinceDetail.id,
                code: selectedData?.center?.provinceDetail.code,
              }
            : null,

        district:
          selectedData?.center && selectedData?.center?.districtDetail
            ? {
                label: selectedData?.center?.districtDetail.name,
                value: selectedData?.center?.districtDetail.id,
                code: selectedData?.center?.districtDetail.code,
              }
            : null,
        sector:
          selectedData?.center && selectedData?.center?.sectorDetail
            ? {
                label: selectedData?.center?.sectorDetail.name,
                value: selectedData?.center?.sectorDetail.id,
                code: selectedData?.center?.sectorDetail.code,
              }
            : null,
        cell:
          selectedData?.center && selectedData?.center?.cellDetail
            ? {
                label: selectedData?.center?.cellDetail.name,
                value: selectedData?.center?.cellDetail.id,
                code: selectedData?.center?.cellDetail.code,
              }
            : null,
        accessRole: selectedData?.accessRole
          ? {
              label: selectedData?.accessRole.name,
              value: selectedData?.accessRole._id,
              level: selectedData?.accessRole.value,
            }
          : null,
        center: selectedData?.center
          ? {
              label: selectedData?.center.name,
              value: selectedData?.center._id,
            }
          : null,
        password: "",
        status: selectedData.status,
      });

      setSupportingDocuments(newSupportingDocuments);
    }
  }, [selectedData]);

  useEffect(() => {
    if (formik?.values?.accessRole?.type?.toUpperCase() === "SUPERADMIN") {
      formik.setFieldError("center", undefined);
    }
  }, [formik.values.accessRole]);

  useEffect(() => {
    let isMounted = true;

    const handleSupportingDocument = async () => {
      if (formik.values.newSupportingDocument && isMounted && selectedData) {
        try {
          const docs = await handleUploadMedia(
            formik.values.newSupportingDocument,
            "ACCOUNT",
            selectedData._id
          );

          if (docs.data && isMounted) {
            setSupportingDocuments((prevDocs) => [
              ...prevDocs,
              {
                name: formik.values.newSupportingDocument.name,
                _id: docs.data._id,
              },
            ]);
            formik.setFieldValue("newSupportingDocument", null);
          }
        } catch (error) {
          console.error("Error uploading document:", error);
          toastMessage("error", error);
        }
      }
    };

    handleSupportingDocument();

    return () => {
      isMounted = false;
    };
  }, [formik.values.newSupportingDocument]);

  return (
    <AccountForm
      {...formik}
      handleClose={handleClose}
      selectedData={selectedData}
      supportingDocuments={supportingDocuments}
      isUploading={loadingUpload}
      setSupportingDocuments={setSupportingDocuments}
    />
  );
}
