import { LanguageContext } from "@/context/LanguageContext";
import { ChangeEvent, useContext } from "react";
import Input from "@/components/input";
import Button from "@/components/button";
import { Modal } from "rsuite";
import SelectDropdown from "@/components/select";

type FormTypes = {
  errors: any;
  handleSubmit: () => void;
  isSubmitting: boolean;
  values: any;
  handleChange: (e: ChangeEvent<any>) => void;
  setFieldValue: any;
  handleClose?: () => void;
};

export default function MessageForm({
  errors,
  handleSubmit,
  isSubmitting,
  values,
  handleChange,
  handleClose,
  setFieldValue,
}: FormTypes) {
  const { translation } = useContext(LanguageContext);

  const smsInstances = [
    {
      label: translation.account_creation,
      value: translation.account_creation,
    },
    {
      label: translation.scheduled_appointment,
      value: translation.scheduled_appointment,
    },
    {
      label: translation.request_approved,
      value: translation.request_approved,
    },
    {
      label: translation.request_rejected,
      value: translation.request_rejected,
    },
  ];

  return (
    <div className="formBody">
      <SelectDropdown
        options={smsInstances}
        name="instanceName"
        label={translation.instance_name}
        placeholder={translation.select}
        required
        value={values.instanceName}
        error={errors.instanceName}
        onChange={(instance) => setFieldValue("instanceName", instance)}
        testId="instanceName"
      />
      {values.instanceName && (
        <Input
          name="instanceType"
          label={translation.instance_type}
          placeholder={translation.instance_type_placeholder}
          required
          value={values.instanceType}
          onChange={(value) => setFieldValue("instanceType", value)}
          error={errors.instanceType}
          testId="instanceType"
        />
      )}
      {/* <SelectDropdown
        options={[
          {
            label: translation.sms,
            value: "sms",
          },
          {
            label: translation.email,
            value: "email",
          },
        ]}
        name="instance"
        label={translation.channel}
        placeholder={translation.select}
        required
        value={values.channel}
        error={errors.channel}
        onChange={(instance) => setFieldValue("channel", instance)}
      />
      {values.channel === "email" && (
        <Input
          name="subject"
          label={translation.subject}
          placeholder={translation.subject_placeholder}
          required
          value={values.subject}
          onChange={handleChange}
          error={errors.subject}
        />
      )} */}
      <Input
        name="message"
        label={translation.message}
        placeholder={translation.message_placeholder}
        required
        value={values.message}
        onChange={(value) => setFieldValue("message", value)}
        error={errors.message}
        isMulti
        testId="message"
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
          testId="submit-button"
        />
      </Modal.Footer>
    </div>
  );
}
