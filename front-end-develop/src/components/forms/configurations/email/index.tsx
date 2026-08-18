import { LanguageContext } from "@/context/LanguageContext";
import { ChangeEvent, useContext } from "react";
import Input from "@/components/input";
import Button from "@/components/button";
import { Modal } from "rsuite";
import CheckboxGroup from "@/components/checkbox/group";
import Checkbox from "@/components/checkbox";
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

export default function EmailForm({
  errors,
  handleSubmit,
  isSubmitting,
  values,
  handleChange,
  handleClose,
  setFieldValue,
}: FormTypes) {
  const { translation } = useContext(LanguageContext);

  return (
    <div className="rs-modal-body">
      <div className="row">
        <div className="col-md-6">
          <Input
            name="fromAddress"
            label={translation.email_from_address}
            required
            value={values.fromAddress}
            onChange={(value) => setFieldValue("fromAddress", value)}
            error={errors.fromAddress}
          />
        </div>
        <div className="col-md-6">
          <Input
            name="smtpAddress"
            label={translation.smtp_address}
            required
            value={values.smtpAddress}
            onChange={(value) => setFieldValue("smtpAddress", value)}
            error={errors.smtpAddress}
          />
        </div>
        <div className="col-md-6">
          <Input
            name="username"
            label={translation.username}
            required
            value={values.username}
            onChange={(value) => setFieldValue("username", value)}
            error={errors.username}
          />
        </div>
        <div className="col-md-6">
          <Input
            name="smtpPort"
            label={translation.smtp_port}
            required
            value={values.smtpPort}
            onChange={(value) => setFieldValue("smtpPort", value)}
            error={errors.smtpPort}
            type="number"
          />
        </div>
        <div className="col-md-6">
          <Input
            name="smtpPassword"
            label={translation.smtp_password}
            required
            value={values.smtpPassword}
            onChange={(value) => setFieldValue("smtpPassword", value)}
            error={errors.smtpPassword}
          />
        </div>
        <div className="col-md-6">
          <Input
            name="effectiveDate"
            label={translation.effective_date}
            required
            value={values.effectiveDate}
            onChange={(value) => setFieldValue("effectiveDate", value)}
            error={errors.effectiveDate}
            type="date"
          />
        </div>

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

        <Checkbox
          label={translation.ssl_enabled}
          name="sslEnable"
          error={errors.sslEnable}
          onChange={(value: string, checked: boolean) =>
            setFieldValue("sslEnable", checked)
          }
          value={values.sslEnable}
          checked={values.sslEnable}
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
    </div>
  );
}
