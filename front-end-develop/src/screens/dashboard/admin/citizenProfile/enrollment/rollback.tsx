import Input from "@/components/input";
import Modal from "@/components/Modal";
import { LanguageContext } from "@/context/LanguageContext";
import toastMessage from "@/utils/common/toastMessage";
import { rollBackValidationSchema } from "@/validation/rollback.validation";
import { useContext, useMemo, useState } from "react";
import { useFormik } from "formik";
import { enrollmentRollback } from "@/api/enrollments";
import { ButtonToolbar } from "rsuite";
import Button from "@/components/button";

type RollbackType = {
  enrollmentId: string;
  rollbackReason: string;
};

function Rollback({
  openModal,
  setOpenModal,
  id
}: {
  openModal: boolean;
  setOpenModal: (openModal: boolean) => void;
  id: string;
}) {
  const { translation } = useContext(LanguageContext);
  const [rollbackReason, setRollbackReason] = useState("");

  const validationSchema = useMemo(
    () => rollBackValidationSchema(translation),
    [translation]
  );

  const rollbackFormik = useFormik<RollbackType>({
    initialValues: {
      rollbackReason: "",
      enrollmentId: id || ""
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        if (!values.rollbackReason || !id) {
          toastMessage(
            "error",
            "Please enter rollback reason and make sure id is present."
          );
          return;
        }
        const payload: RollbackType = {
          enrollmentId: id,
          rollbackReason: values.rollbackReason
        };
        const data = await enrollmentRollback(payload);
        toastMessage("success", data?.message);
        setOpenModal(false);
      } catch (error) {
        toastMessage("error", error);
      }
    },
    enableReinitialize: true
  });

  return (
    <Modal
      show={openModal}
      handleClose={() => setOpenModal(false)}
      title={translation.biometrics}
    >
      <div className="card-body  rs-modal-body">
        <Input
          name="rollbackReason"
          placeholder={translation.reason_placeholder}
          label={translation.reason}
          value={rollbackFormik.values.rollbackReason}
          error={rollbackFormik.errors.rollbackReason}
          required
          onChange={(value) =>
            rollbackFormik.setFieldValue("rollbackReason", value)
          }
        />
        <ButtonToolbar>
          <Button
            text={translation.cancel}
            onClick={() => setOpenModal(false)}
            appearance="primary"
            color="red"
          />
          <Button
            text={translation.submit}
            loading={rollbackFormik.isSubmitting}
            onClick={rollbackFormik.handleSubmit}
          />
        </ButtonToolbar>
      </div>
    </Modal>
  );
}

export default Rollback;
