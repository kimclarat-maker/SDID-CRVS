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
  enableLogin?: boolean;
};

export default function LoginForm({
  errors,
  handleSubmit,
  isSubmitting,
  values,
  setFieldValue,
  enableLogin,
}: FormTypes) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const { translation } = useContext(LanguageContext);

  const handleShowPassword = () => {
    setPasswordVisible(!passwordVisible);
  };

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
        leftIcon="email"
        testId="email"
      />
      <Input
        name="password"
        label={translation.password}
        placeholder={translation.password_placeholder}
        required
        value={values.password}
        onChange={(value) => setFieldValue("password", value)}
        error={errors.password}
        type={passwordVisible ? "text" : "password"}
        leftIcon="lock"
        rightIcon={passwordVisible ? "visibility" : "visibility_off"}
        handleShowPassword={handleShowPassword}
        testId="password"
      />
      <ButtonToolbar>
        <Button
          text={translation.login}
          onClick={handleSubmit}
          loading={isSubmitting}
          block
          testId="submit-button"
          disabled={!enableLogin}
        />
      </ButtonToolbar>
      <br />
    </>
  );
}
