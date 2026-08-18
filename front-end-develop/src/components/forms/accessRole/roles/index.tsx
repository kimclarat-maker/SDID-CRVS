import { LanguageContext } from "@/context/LanguageContext";
import { ChangeEvent, useContext } from "react";
import Input from "@/components/input";
import Button from "@/components/button";
import { Modal } from "rsuite";
import RadioGroup from "@/components/radio/group";
import Radio from "@/components/radio";
import SelectDropdown from "@/components/select";
import { permissions } from "@/constants/permissions";

type FormTypes = {
  errors: any;
  handleSubmit: () => void;
  isSubmitting: boolean;
  values: any;
  handleChange: (e: ChangeEvent<any>) => void;
  setFieldValue: any;
  handleClose?: () => void;
};

export default function RoleForm({
  errors,
  handleSubmit,
  isSubmitting,
  values,
  handleClose,
  setFieldValue,
}: FormTypes) {
  const { translation } = useContext(LanguageContext);

  return (
    <>
      <div className="card-body  rs-modal-body">
        <Input
          name="name"
          label={translation.name}
          placeholder={translation.name_placeholder}
          required
          value={values.name}
          onChange={(value) => setFieldValue("name", value)}
          error={errors.name}
        />
        <SelectDropdown
          options={permissions}
          type="object"
          name="value"
          label={translation.category}
          placeholder={translation.select}
          value={values.value}
          onChange={(value) => setFieldValue("value", value)}
          error={errors.value}
        />

        <RadioGroup
          name={translation.status}
          error={errors.status}
          onChange={(status) => setFieldValue("status", status)}
          value={values.status}
          inline
        >
          {[
            {
              label: translation.active,
              value: "active",
            },
            {
              label: translation.inactive,
              value: "inactive",
            },
          ].map((el: any, i) => {
            return (
              <Radio
                name={el.label}
                label={el.label}
                value={el.value}
                key={i}
              />
            );
          })}
        </RadioGroup>
      </div>

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
    </>
  );
}
