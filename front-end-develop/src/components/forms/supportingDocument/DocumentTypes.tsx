import { LanguageContext } from "@/context/LanguageContext";
import { ChangeEvent, useContext } from "react";
import { SupportingDocumentTypes } from "@/types/SupportingDocument";
import Checkbox from "@/components/checkbox";
import SelectDropdown from "@/components/select";
import { Modal } from "rsuite";
import Button from "@/components/button";

const formats = [
  {
    label: "PDF",
    value: "pdf",
  },
  {
    label: "JPG",
    value: "jpg",
  },
  {
    label: "PNG",
    value: "png",
  },
];

interface FormTypes {
  errors: any;
  handleSubmit: () => void;
  isSubmitting: boolean;
  values: any;
  handleChange: (e: ChangeEvent<any>) => void;
  setFieldValue: any;
  handleClose?: () => void;
  selectedData?: SupportingDocumentTypes;
}

export default function DocumentTypes({
  errors,
  handleSubmit,
  isSubmitting,
  values,
  setFieldValue,
  handleClose,
}: FormTypes) {
  const { translation } = useContext(LanguageContext);

  return (
    <>
      {" "}
      <div className="row">
        <>
          <div className="col-md-12">
            <SelectDropdown
              options={values.documentTypes}
              name="documentTypes"
              label={translation.document_name}
              placeholder={translation.type_to_create}
              required
              value={values.documentTypes}
              onChange={(value) => setFieldValue("documentTypes", value)}
              error={errors.documentTypes}
              leftIcon="add"
              type="object"
              isCreatable
              isMulti
            />
          </div>
          <div className="col-md-12">
            <SelectDropdown
              options={formats}
              name="allowedFormats"
              label={translation.allowed_format}
              placeholder={translation.select}
              required
              value={values.allowedFormats}
              onChange={(value) => setFieldValue("allowedFormats", value)}
              error={errors.allowedFormats}
              leftIcon="list"
              type="object"
              isMulti
            />
          </div>
          <div className="col-md-12 mb-3">
            <Checkbox
              label={translation.required}
              error={errors.isRequired}
              onChange={(e) => setFieldValue("isRequired", !values.isRequired)}
              checked={values.isRequired}
              name="isRequired"
            />
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
        </>
      </div>
    </>
  );
}
