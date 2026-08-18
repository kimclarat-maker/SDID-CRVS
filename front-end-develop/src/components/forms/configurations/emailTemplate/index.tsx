import { LanguageContext } from "@/context/LanguageContext";
import { ChangeEvent, useContext, useEffect } from "react";
import Input from "@/components/input";
import Button from "@/components/button";
import { Modal } from "rsuite";
import SelectDropdown from "@/components/select";
import { useFetchEmailFlows } from "@/hooks/useEmail";

type FormTypes = {
  errors: any;
  handleSubmit: () => void;
  isSubmitting: boolean;
  values: any;
  handleChange: (e: ChangeEvent<any>) => void;
  setFieldValue: any;
  handleClose?: () => void;
};

export default function EmailTemplateForm({
  errors,
  handleSubmit,
  isSubmitting,
  values,
  handleClose,
  setFieldValue,
}: FormTypes) {
  const { translation } = useContext(LanguageContext);
  const { flows, loadingFlows, fetchEmailFlowsData } =
    useFetchEmailFlows("dropdown");

  useEffect(() => {
    fetchEmailFlowsData();
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
      <div className="row">
        <div className="col-md-4">
          <Input
            name="emailSubENG"
            label={translation.subject + "(ENGLISH)"}
            placeholder={translation.subject_placeholder}
            required
            value={values.emailSubENG}
            onChange={(value) => setFieldValue("emailSubENG", value)}
            error={errors.emailSubENG}
            isMulti
          />
        </div>
        <div className="col-md-4">
          <Input
            name="emailSubFR"
            label={translation.subject + "(FRENCH)"}
            placeholder={translation.subject_placeholder}
            required
            value={values.emailSubFR}
            onChange={(value) => setFieldValue("emailSubFR", value)}
            error={errors.emailSubFR}
            isMulti
          />
        </div>
        <div className="col-md-4">
          <Input
            name="emailSubRW"
            label={translation.subject + "(KINYARWANDA)"}
            placeholder={translation.subject_placeholder}
            required
            value={values.emailSubRW}
            onChange={(value) => setFieldValue("emailSubRW", value)}
            error={errors.emailSubRW}
            isMulti
          />
        </div>
      </div>
      <div className="row">
        <div className="col-md-4">
          <Input
            name="emailTextENG"
            label={translation.message + "(ENGLISH)"}
            placeholder={translation.message_placeholder}
            required
            value={values.emailTextENG}
            onChange={(value) => setFieldValue("emailTextENG", value)}
            error={errors.emailTextENG}
            isMulti
            testId="emailTextENG"
          />
        </div>
        <div className="col-md-4">
          <Input
            name="emailTextFR"
            label={translation.message + "(FRENCH)"}
            placeholder={translation.message_placeholder}
            required
            value={values.emailTextFR}
            onChange={(value) => setFieldValue("emailTextFR", value)}
            error={errors.emailTextFR}
            isMulti
            testId="emailTextFR"
          />
        </div>
        <div className="col-md-4">
          <Input
            name="emailTextRW"
            label={translation.message + "(KINYARWANDA)"}
            placeholder={translation.message_placeholder}
            required
            value={values.emailTextRW}
            onChange={(value) => setFieldValue("emailTextRW", value)}
            error={errors.emailTextRW}
            isMulti
            testId="emailTextRW"
          />
        </div>
        <div className="col-md-4">
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
