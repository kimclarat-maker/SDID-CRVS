import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect, useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import toastMessage from "@/utils/common/toastMessage";
import { CenterType } from "@/types/Center";
import CenterForm from "@/components/forms/center";
import api from "@/api";
import { replaceDialCode } from "@/utils/common/replaceDialCode";
import { transferValidationSchema } from "@/validation/transfer.validation";
import { AddTransferType, TransferType } from "@/types/Transfers";
import TransferForm from "@/components/forms/transfer";
import { isDemoMode } from "@/demo/config";
import { demoTransferAppointment } from "@/demo/services/appointments";

export default function NewTransfer({
  handleClose,
  selectedData,
  fetchData,
}: {
  handleClose: () => void;
  selectedData?: TransferType;
  fetchData?: () => void;
}) {
  const { translation } = useContext(LanguageContext);

  const validationSchema = useMemo(
    () => transferValidationSchema(translation),
    [translation]
  );

  const formik = useFormik<AddTransferType>({
    initialValues: {
      origin: "",
      destination: "",
      startDate: "",
      endDate: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        if (isDemoMode() && selectedData?._id) {
          await demoTransferAppointment(selectedData._id, values.destination);
          toastMessage("success", "Appointment transferred (demo).");
        }
        handleClose && handleClose();
        fetchData && fetchData();
      } catch (error: any) {
        toastMessage("error", error);
      }
    },
  });

  useEffect(() => {
    if (selectedData && selectedData._id) {
      let body: any = {
        origin: selectedData.fromCenter._id,
        destination: selectedData.toCenter._id,
      };

      formik.setValues(body);
    }
  }, [selectedData]);

  return <TransferForm {...formik} handleClose={handleClose} />;
}
