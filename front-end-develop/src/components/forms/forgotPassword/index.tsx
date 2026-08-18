import { LanguageContext } from "@/context/LanguageContext";
import { ChangeEvent, useContext } from "react";
import Input from "@/components/input";
import { useNavigate } from "react-router-dom";
import Button from "@/components/button";

type FormTypes = {
  errors: any;
  handleSubmit: () => void;
  isSubmitting: boolean;
  values: any;
  handleChange: (e: ChangeEvent<any>) => void;
  setFieldValue: any;
};

export default function ForgotPasswordForm({
  errors,
  handleSubmit,
  isSubmitting,
  values,
  setFieldValue,
}: FormTypes) {
  const { translation } = useContext(LanguageContext);
  const navigate = useNavigate();

  return (
    <div className="formBody">
      <form>
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
        <center>
          <div style={{ marginBottom: "1.5rem" }}>
            <Button
              text={translation.submit}
              onClick={handleSubmit}
              loading={isSubmitting}
              testId="submit_button"
              block
            />
          </div>
        </center>
      </form>
      <center>
        <Button
          text={translation.go_back}
          onClick={() => navigate("/")}
          testId="back_button"
          appearance="ghost"
          block
        />
      </center>
    </div>
  );
}
