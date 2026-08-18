import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useMemo } from "react";
import Input from "@/components/input";
import Button from "@/components/button";
import { ButtonToolbar } from "rsuite";
import { rollBackValidationSchema } from "@/validation//rollback.validation";
import { useFormik } from "formik";
import { createRollBack } from "@/api/rollBacks";
import toastMessage from "@/utils/common/toastMessage";
import { getStorage } from "@/utils/storage";

type Props = {
  setOpen: (open: boolean) => void;
  preEnrollmentId: string;
};

type RollBackFormType = {
  rollbackReason: string;
};

export default function RollBackForm({ setOpen, preEnrollmentId }: Props) {
  const { translation } = useContext(LanguageContext);

  const validationSchema = useMemo(
    () => rollBackValidationSchema(translation),
    [translation]
  );

  const formik = useFormik<RollBackFormType>({
    initialValues: {
      rollbackReason: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const dataRemote: any = await createRollBack({
          rollbackReason: values.rollbackReason,
          preEnrollmentId,
          isRemoteFetchForceEnabled: true,
        });

        const loginType = await getStorage("loginType", "local");

        if (loginType === "local" || loginType === '"local"') {
          await createRollBack({
            rollbackReason: values.rollbackReason,
            preEnrollmentId,
          });
        }

        if (!dataRemote) return;
        console.log("rollback data", dataRemote);

        setOpen && setOpen(false);

        toastMessage("success", dataRemote.message);
      } catch (error) {
        toastMessage("error", error);
      }
    },
    enableReinitialize: true,
  });

  return (
    <div className="rs-modal-body">
      <Input
        name="reason"
        label={translation.reason}
        placeholder={translation.reason_placeholder}
        required
        value={formik.values.rollbackReason}
        onChange={(value) => formik.setFieldValue("rollbackReason", value)}
        error={formik.errors.rollbackReason}
        testId="reason"
      />
      <ButtonToolbar>
        <Button
          text={translation.submit}
          onClick={formik.handleSubmit}
          loading={formik.isSubmitting}
          block
          testId="submit-button"
          type="submit"
        />
      </ButtonToolbar>
      <br />
    </div>
  );
}
