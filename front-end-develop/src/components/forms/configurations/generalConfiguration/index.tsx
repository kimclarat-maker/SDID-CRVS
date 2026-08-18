import { LanguageContext } from "@/context/LanguageContext";
import { ChangeEvent, useContext } from "react";
import Input from "@/components/input";
import Button from "@/components/button";
import { Modal } from "rsuite";

type FormTypes = {
  errors: any;
  handleSubmit: () => void;
  isSubmitting: boolean;
  values: any;
  handleChange: (e: ChangeEvent<any>) => void;
  setFieldValue: any;
  handleClose?: () => void;
};

export default function GeneralConfigurationForm({
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
        name="configurationType"
        label={translation.type}
        placeholder={translation.type_placeholder}
        required
        value={values.type}
        onChange={(value) => setFieldValue("type", value)}
        error={errors.type}
      />
      <Input
        name="duration"
        label={translation.duration}
        required
        value={values.duration}
        onChange={(value) => setFieldValue("duration", value)}
        error={errors.duration}
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
          testId="submit-button"
        />
      </Modal.Footer>
    </div>
  );
}
