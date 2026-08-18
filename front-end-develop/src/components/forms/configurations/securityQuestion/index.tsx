import { LanguageContext } from "@/context/LanguageContext";
import { ChangeEvent, useContext } from "react";
import Input from "@/components/input";
import Button from "@/components/button";
import { Modal } from "rsuite";
import { DocumentType } from "@/types/DocumentType";
import CheckboxGroup from "@/components/checkbox/group";
import Checkbox from "@/components/checkbox";
import RadioGroup from "@/components/radio/group";
import Radio from "@/components/radio";
import SelectDropdown from "@/components/select";

type FormTypes = {
  errors: any;
  handleSubmit: () => void;
  isSubmitting: boolean;
  values: any;
  handleChange: (e: ChangeEvent<any>) => void;
  setFieldValue: any;
  handleClose?: () => void;

  documentTypes: DocumentType[];
  loadingDocumentTypes: boolean;
};

export default function SecurityQuestionForm({
  errors,
  handleSubmit,
  isSubmitting,
  values,
  handleClose,
  documentTypes,
  loadingDocumentTypes,
  setFieldValue,
}: FormTypes) {
  const { translation } = useContext(LanguageContext);
  console.log(values.documentType);

  return (
    <>
      <div className="row">
        <div className="col-md-6">
          <Input
            name="name"
            label={translation.question + "(ENGLISH)"}
            required
            value={values.questionEnglish}
            onChange={(value) => setFieldValue("questionEnglish", value)}
            error={errors.questionEnglish}
          />
        </div>
        <div className="col-md-6">
          <Input
            name="name"
            label={translation.question + "(FRENCH)"}
            required
            value={values.questionFrench}
            onChange={(value) => setFieldValue("questionFrench", value)}
            error={errors.questionFrench}
          />
        </div>
        <div className="col-md-6">
          <Input
            name="name"
            label={translation.question + "(KINYARWANDA)"}
            required
            value={values.questionKinyarwanda}
            onChange={(value) => setFieldValue("questionKinyarwanda", value)}
            error={errors.questionKinyarwanda}
          />
        </div>
        <div className="col-md-6">
          <Input
            name="value"
            label={translation.value}
            required
            value={values.value}
            onChange={(value) => setFieldValue("value", value)}
            error={errors.value}
          />
        </div>
        <div className="col-md-6">
          <SelectDropdown
            options={[
              {
                label: "Text",
                value: "text",
              },
              {
                label: "Date",
                value: "date",
              },
              {
                label: "Number",
                value: "number",
              },
            ]}
            name="answerType"
            label={translation.answer_type}
            required
            value={values.answerType}
            onChange={(value) => setFieldValue("answerType", value)}
            error={errors.answerType}
          />
        </div>
        {/* <div className="col-md-12">
          <SelectDropdown
            options={documentTypes}
            name="documentType"
            label={translation.document_type}
            required
            value={values.documentType}
            onChange={handleChange}
            error={errors.documentType}
            onSearch={(search: string) => fetchDocumentTypes(search)}
          />
        </div> */}
        <CheckboxGroup
          name={translation.document_type}
          error={errors.documentType}
          onChange={(documentType) =>
            setFieldValue("documentType", documentType)
          }
          value={values.documentType}
          loading={loadingDocumentTypes}
          testId="documentType"
        >
          {documentTypes.map((el: DocumentType, i) => {
            return (
              <Checkbox
                key={i}
                name={`${el.name} (${translation[el.citizenship]})`}
                label={`${el.name} (${translation[el.citizenship]})`}
                value={el._id || ""}
              />
            );
          })}
        </CheckboxGroup>

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
      </div>
      <Modal.Footer>
        <Button
          text={translation.cancel}
          onClick={() => (handleClose ? handleClose() : null)}
          appearance="default"
        />
        <Button
          text={translation.verify}
          onClick={handleSubmit}
          loading={isSubmitting}
        />
      </Modal.Footer>
    </>
  );
}
