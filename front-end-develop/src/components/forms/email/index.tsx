import { LanguageContext } from "@/context/LanguageContext";
import { ChangeEvent, useContext, useState } from "react";
import Input from "@/components/input";
import Button from "@/components/button";
import { ButtonToolbar } from "rsuite";

type FormTypes = {
  errors: any;
  handleSubmit: () => void;
  isSubmitting: boolean;
  values: any;
  handleChange: (e: ChangeEvent<any>) => void;
  setFieldValue: any;
  goBack: () => void;
};

export default function EmailForm({
  errors,
  handleSubmit,
  isSubmitting,
  values,
  setFieldValue,
  goBack,
}: FormTypes) {
  const { translation } = useContext(LanguageContext);

  return (
    <>
      <Input
        name="email"
        label={translation.email_address}
        placeholder={translation.email_address_placeholder}
        required
        value={values.email}
        onChange={(value) => setFieldValue("email", value)}
        error={errors.email}
        testId="email"
        type="email"
        disabled
      />

      <ButtonToolbar>
        <Button
          text={translation.submit}
          onClick={handleSubmit}
          loading={isSubmitting}
          block
          testId="submit-button"
          type="submit"
        />
        <Button
          text={translation.go_back}
          onClick={goBack}
          block
          testId="go_back"
          appearance="default"
        />
      </ButtonToolbar>
    </>
  );
}
