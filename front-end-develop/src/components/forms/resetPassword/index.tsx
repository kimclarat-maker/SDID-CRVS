import { LanguageContext } from "@/context/LanguageContext";
import { ChangeEvent, useContext, useState } from "react";
import Input from "@/components/input";
import Button from "@/components/button";
import Checkbox from "@/components/checkbox";

type FormTypes = {
  errors: any;
  handleSubmit: () => void;
  isSubmitting: boolean;
  values: any;
  handleChange: (e: ChangeEvent<any>) => void;
  setFieldValue: any;
};

export default function ResetPasswordForm({
  errors,
  handleSubmit,
  isSubmitting,
  values,
  setFieldValue,
}: FormTypes) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const { translation } = useContext(LanguageContext);

  const handleShowPassword = () => {
    setPasswordVisible(!passwordVisible);
  };

  return (
    <div className="formBody">
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
        testId="password"
      />
      <Input
        name="newPassword"
        label={translation.confirm_password}
        placeholder={translation.confirm_password_placeholder}
        required
        value={values.newPassword}
        onChange={(value) => setFieldValue("newPassword", value)}
        error={errors.newPassword}
        type={passwordVisible ? "text" : "password"}
        leftIcon="lock"
        testId="newPassword"
        helperContent={
          <div style={{ marginTop: 16, marginLeft: -10 }}>
            <Checkbox
              name="showPassword"
              label={translation.show_password}
              onChange={handleShowPassword}
              checked={passwordVisible}
            />
          </div>
        }
      />

      <center>
        <div>
          <Button
            text={translation.submit}
            onClick={handleSubmit}
            loading={isSubmitting}
            testId="submit-button"
            block
          />
        </div>
      </center>
    </div>
  );
}
