import { LanguageContext } from "@/context/LanguageContext";
import { ChangeEvent, useContext } from "react";
import Input from "@/components/input";
import Button from "@/components/button";
import { Modal } from "rsuite";
import RadioGroup from "@/components/radio/group";
import Radio from "@/components/radio";

type FormTypes = {
  errors: any;
  handleSubmit: () => void;
  isSubmitting: boolean;
  values: any;
  handleChange: (e: ChangeEvent<any>) => void;
  setFieldValue: any;
  handleClose?: () => void;
};

export default function CountryForm({
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
        name="countryName"
        label={translation.countryName}
        placeholder={translation.name_placeholder}
        required
        value={values.countryName}
        onChange={(value) => setFieldValue("countryName", value)}
        error={errors.countryName}
      />
      <Input
        name="code"
        label={translation.country_code}
        placeholder={translation.country_code_placeholder}
        required
        value={values.code}
        onChange={(value) => setFieldValue("code", value)}
        error={errors.code}
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
            <Radio name={el.label} label={el.label} value={el.value} key={i} />
          );
        })}
      </RadioGroup>
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
