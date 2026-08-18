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

export default function PhoneNumberForm({
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
        name="phoneNumber"
        label={translation.phone_number}
        placeholder={translation.phone_number_placeholder}
        required
        value={values.phoneNumber}
        onChange={(value) => setFieldValue("phoneNumber", value)}
        error={errors.phoneNumber}
        testId="phoneNumber"
        withCountry
        country={values.country}
        onChangeCountry={(e) => setFieldValue("country", e)}
        max={9}
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
