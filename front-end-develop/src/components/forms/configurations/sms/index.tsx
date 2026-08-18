import { LanguageContext } from "@/context/LanguageContext";
import { ChangeEvent, useContext } from "react";
import Input from "@/components/input";
import Button from "@/components/button";
import { Modal, Radio } from "rsuite";
import RadioGroup from "@/components/radio/group";
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

export default function SMSForm({
  errors,
  handleSubmit,
  isSubmitting,
  values,
  setFieldValue,
  handleClose
}: FormTypes) {
  const { translation } = useContext(LanguageContext);

  return (
    <div className="rs-modal-body">
      <div className="row">
        <div className="col-md-12">
          <RadioGroup
            name={translation.scope}
            error={errors.scope}
            onChange={(scope) => setFieldValue("scope", scope)}
            value={values.scope}
            testId="scope"
            data-testid="scope"
            inline
          >
            {[
              {
                label: translation.local,
                value: "local"
              },
              {
                label: translation.international,
                value: "international"
              }
            ].map((el: any, i) => {
              return (
                <Radio value={el.value} key={i}>
                  {el.label}
                </Radio>
              );
            })}
          </RadioGroup>
        </div>

        <div className="col-md-12">
          <SelectDropdown
            options={[
              {
                label: "Pindo",
                value: "pindo"
              },
              {
                label: "Twilio",
                value: "twilio"
              },
              {
                label: "FDI",
                value: "fdi"
              },
              {
                label: "INTOUCH - SMPP",
                value: "intouch_smpp"
              },
              {
                label: "INTOUCH - HTTP",
                value: "intouch_http"
              }
            ]}
            name="smsProvider"
            label={translation.sms_provider}
            required
            value={values.smsProvider}
            onChange={(value) => setFieldValue("smsProvider", value)}
            error={errors.smsProvider}
          />
        </div>
        <div className="col-md-12">
          <Input
            name="apiKey"
            label={translation.sms_api_key}
            required
            value={values.apiKey}
            onChange={(value) => setFieldValue("apiKey", value)}
            error={errors.apiKey}
          />
        </div>

        <div className="col-md-12">
          <Input
            name="serviceId"
            label={translation.service_id}
            value={values.serviceId}
            onChange={(value) => setFieldValue("serviceId", value)}
            error={errors.serviceId}
          />
        </div>

        <div className="col-md-12">
          <Input
            name="mobileServiceId"
            label={translation.mobile_service_id}
            value={values.mobileServiceId}
            onChange={(value) => setFieldValue("mobileServiceId", value)}
            error={errors.mobileServiceId}
          />
        </div>

        <div className="col-md-6">
          <Input
            name="email"
            label={translation.sms_email}
            value={values.email}
            onChange={(value) => setFieldValue("email", value)}
            error={errors.email}
          />
        </div>

        <div className="col-md-6">
          <Input
            name="username"
            label={translation.username}
            value={values.username}
            onChange={(value) => setFieldValue("username", value)}
            error={errors.username}
          />
        </div>

        <div className="col-md-6">
          <Input
            name="baseUrl"
            label={translation.base_url}
            value={values.baseUrl}
            onChange={(value) => setFieldValue("baseUrl", value)}
            error={errors.baseUrl}
          />
        </div>

        <div className="col-md-12">
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

        <div className="col-md-12">
          <RadioGroup
            name={translation.status}
            error={errors.status}
            onChange={(status) => setFieldValue("status", status)}
            value={values.status}
            testId="status"
            data-testid="status"
            inline
          >
            {[
              {
                label: translation.active,
                value: "active"
              },
              {
                label: translation.inactive,
                value: "inactive"
              }
            ].map((el: any, i) => {
              return (
                <Radio value={el.value} key={i}>
                  {el.label}
                </Radio>
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
      </div>
    </div>
  );
}
