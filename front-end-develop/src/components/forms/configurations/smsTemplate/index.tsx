import { LanguageContext } from "@/context/LanguageContext";
import { ChangeEvent, useContext, useEffect } from "react";
import Input from "@/components/input";
import Button from "@/components/button";
import { Modal } from "rsuite";
import SelectDropdown from "@/components/select";
import { useFetchSMSFlows } from "@/hooks/useSMS";

type FormTypes = {
  errors: any;
  handleSubmit: () => void;
  isSubmitting: boolean;
  values: any;
  handleChange: (e: ChangeEvent<any>) => void;
  setFieldValue: any;
  handleClose?: () => void;
};

export default function SMSTemplateForm({
  errors,
  handleSubmit,
  isSubmitting,
  values,
  handleChange,
  handleClose,
  setFieldValue,
}: FormTypes) {
  const { translation } = useContext(LanguageContext);

  const { flows, loadingFlows, fetchSMSFlowsData } =
    useFetchSMSFlows("dropdown");

  useEffect(() => {
    fetchSMSFlowsData();
  }, []);

  return (
    <div className="formBody rs-modal-body">
      <SelectDropdown
        options={flows}
        loading={loadingFlows}
        name="flowId"
        label={translation.flow_id}
        placeholder={translation.flow_id_placeholder}
        required
        value={values.flowId}
        onChange={(value) => setFieldValue("flowId", value)}
        error={errors.flowId}
      />
      <Input
        name="smsSub"
        label={translation.subject}
        placeholder={translation.subject_placeholder}
        required
        value={values.smsSub}
        onChange={(value) => setFieldValue("smsSub", value)}
        error={errors.smsSub}
      />
      <div className="row">
        <div className="col-md-6">
          <Input
            name="smsTextENG"
            label={translation.message + "(ENGLISH)"}
            placeholder={translation.message_placeholder}
            required
            value={values.smsTextENG}
            onChange={(value) => setFieldValue("smsTextENG", value)}
            error={errors.smsTextEng}
            isMulti
            testId="smsTextENG"
          />
        </div>
        <div className="col-md-6">
          <Input
            name="smsTextFR"
            label={translation.message + "(FRENCH)"}
            placeholder={translation.message_placeholder}
            required
            value={values.smsTextFR}
            onChange={(value) => setFieldValue("smsTextFR", value)}
            error={errors.smsTextFR}
            isMulti
            testId="smsTextFR"
          />
        </div>
        <div className="col-md-6">
          <Input
            name="smsTextRW"
            label={translation.message + "(KINYARWANDA)"}
            placeholder={translation.message_placeholder}
            required
            value={values.smsTextRW}
            onChange={(value) => setFieldValue("smsTextRW", value)}
            error={errors.smsTextRW}
            isMulti
            testId="smsTextRW"
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
          testId="submit-button"
        />
      </Modal.Footer>
    </div>
  );
}
