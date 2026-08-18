import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import toastMessage from "@/utils/common/toastMessage";
import api from "@/api";
import DeviceForm from "@/components/forms/device";
import { DeviceType } from "@/types/Device";
import { deviceValidationSchema } from "@/validation/device.validation";
import { AccountType } from "@/types/Account";
import { getStorage } from "@/utils/storage";

export default function AddDevices({
  handleClose,
  selectedData,
  fetchData,
}: {
  handleClose: () => void;
  selectedData?: DeviceType;
  fetchData: () => void;
}) {
  const { translation } = useContext(LanguageContext);
  const [userLoggedIn, setUserLoggedIn] = useState<AccountType>(
    {} as AccountType
  );
  const [isUpdate, setIsUpdate] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const user = await getStorage();
      setUserLoggedIn(user);
    };

    getUser();
  }, []);
  const validationSchema = useMemo(
    () => deviceValidationSchema(translation),
    [translation]
  );

  const formik = useFormik<DeviceType>({
    initialValues: {
      serialNumber: null,
      name: "",
      model: "",
      item: "",
      deviceType: null,
      status: null,
      country: null,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        let method = "POST",
          url = `/devices`,
          body: any = {
            name: values.name,
            serialNumber: values.serialNumber?.value,
            model: values.model,
            item: values.item,
            status:
              typeof values.status === "string"
                ? values.status
                : values.status?.value,
            deviceType: values.deviceType?.value,
            condition:
              typeof values.status === "string"
                ? values.condition
                : values.condition?.value,
            centerId: values?.centerId?.value,
          };

        if (userLoggedIn && userLoggedIn?.account?.centerId) {
          body = {
            ...body,
            centerId: userLoggedIn?.account?.centerId,
          };
        }

        if (selectedData) {
          Object.keys(body).forEach((key) => {
            if (body[key] === selectedData[key]) {
              delete body[key];
            }
          });
        }

        if (selectedData && selectedData._id) {
          method = "PATCH";
          url = `/devices/${selectedData._id}`;
        } else {
          url = `/devices/register`;
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
      setIsUpdate(true);
      formik.setValues({
        serialNumber: selectedData.serialNumber
          ? {
              value: selectedData.serialNumber,
              label: selectedData.serialNumber,
            }
          : null,
        deviceType: selectedData.deviceType
          ? {
              label: selectedData.deviceType,
              value: selectedData.deviceType,
            }
          : null,
        name: selectedData.name,
        model: selectedData.model,
        item: selectedData.item,
        condition: selectedData.condition,
        status: selectedData.status,
        centerId: selectedData.center
          ? {
              label: String(selectedData.center?.name),
              value: String(selectedData.center?._id),
            }
          : null,
      });

      return;
    }
    setIsUpdate(false);
  }, [selectedData]);

  useEffect(() => {
    if (formik.values.deviceType && !selectedData?.serialNumber) {
      formik.setFieldValue("serialNumber", null);
    }
  }, [formik.values.deviceType]);

  return (
    <DeviceForm
      {...formik}
      handleClose={handleClose}
      deviceId={selectedData?._id}
      accountId={selectedData?.accountId}
      formik={formik}
      refreshList={fetchData}
      isUpdate={isUpdate}
    />
  );
}
