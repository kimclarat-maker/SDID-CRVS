import { LanguageContext } from "@/context/LanguageContext";
import { ChangeEvent, useContext } from "react";
import SelectDropdown from "@/components/select";
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

export default function DropdownMenuForm({
  errors,
  handleSubmit,
  isSubmitting,
  values,
  handleChange,
  handleClose,
}: FormTypes) {
  const { translation } = useContext(LanguageContext);

  return (
    <>
      <div className="card-body">
        <SelectDropdown
          options={[]}
          name="menu"
          label={translation.menu}
          placeholder={translation.select}
          required
          value={values.menu}
          onChange={handleChange}
          error={errors.menu}
        />
      </div>

      <Modal.Footer>
        <Button
          text={translation.cancel}
          onClick={() => (handleClose ? handleClose() : null)}
          loading={isSubmitting}
          appearance="default"
        />
        <Button
          text={translation.submit}
          onClick={handleSubmit}
          loading={isSubmitting}
        />
      </Modal.Footer>
    </>
  );
}
