import { LanguageContext } from "@/context/LanguageContext";
import { ChangeEvent, useContext } from "react";
import Input from "@/components/input";
import Button from "@/components/button";
import { Modal } from "rsuite";
import { CenterType } from "@/types/Center";

type FormTypes = {
  errors: any;
  handleSubmit: () => void;
  isSubmitting: boolean;
  values: any;
  handleChange: (e: ChangeEvent<any>) => void;
  setFieldValue: any;
  handleClose?: () => void;
  selectedData?: any;
  setValues?: (data: any) => void;
};

export default function OffdayForm({
  errors,
  handleSubmit,
  isSubmitting,
  values,
  handleClose,
  setFieldValue,
}: FormTypes) {
  const { translation } = useContext(LanguageContext);
  return (
    <div className="formBody">
      <Input
        name="offday"
        label={translation.date}
        required
        value={values.offday}
        onChange={(value) => setFieldValue("offday", value)}
        error={errors.offday}
        type="date"
      />

      <Modal.Footer>
        <Button
          text={translation.cancel}
          onClick={() => (handleClose ? handleClose() : null)}
          appearance="default"
        />
        <Button
          text={translation.submit}
          onClick={handleSubmit}
          loading={isSubmitting}
        />
      </Modal.Footer>
    </div>
  );
}
