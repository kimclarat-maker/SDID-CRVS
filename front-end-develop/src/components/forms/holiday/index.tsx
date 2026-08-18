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

export default function HolidayForm({
  errors,
  handleSubmit,
  isSubmitting,
  values,
  setFieldValue,
  handleClose,
}: FormTypes) {
  const { translation } = useContext(LanguageContext);

  return (
    <div className="formBody rs-modal-body">
      <Input
        name="name"
        label={translation.name}
        placeholder={translation.name_placeholder}
        required
        value={values.name}
        onChange={(value) => setFieldValue("name", value)}
        error={errors.name}
      />
      <Input
        name="holidayDate"
        label={translation.date}
        required
        value={values.holidayDate}
        onChange={(value) => setFieldValue("holidayDate", value)}
        error={errors.holidayDate}
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
