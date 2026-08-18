import { LanguageContext } from "@/context/LanguageContext";
import { ChangeEvent, useContext, useEffect, useState } from "react";
import Button from "@/components/button";
import { Modal } from "rsuite";
import SelectDropdown from "@/components/select";
import { SupportingDocumentTypes } from "@/types/SupportingDocument";
import { fieldsSupportDocument } from "@/constants/citizenInfoRequiredFields";
import Checkbox from "@/components/checkbox";
import Input from "@/components/input";

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

export default function SupportingDocumentForm({
  errors,
  handleSubmit,
  isSubmitting,
  values,
  handleClose,
  setFieldValue,
}: FormTypes) {
  const { translation } = useContext(LanguageContext);
  const [documentTypesMultiLang, setDocumentTypesMultiLang] = useState<any>([]);

  useEffect(() => {
    if (values.documentTypesMultiLang) {
      setDocumentTypesMultiLang(values.documentTypesMultiLang);
    }
  }, [values.documentTypesMultiLang]);

  const renderDocument = (i: number) => {
    return (
      <div className="card mb-3" style={{ backgroundColor: "var(--bg-color)" }}>
        <div className="card-body">
          <div className="row" key={i}>
            <div className="col-md-6">
              <Input
                name={`documentTypesMultiLang[${i}].en`}
                label={"English: " + translation.document_type}
                placeholder={translation.document_type_placeholder}
                required
                value={values?.documentTypesMultiLang?.[i]?.en || ""}
                onChange={(value) =>
                  setFieldValue(`documentTypesMultiLang[${i}].en`, value)
                }
                error={errors.documentTypesMultiLang?.[i]?.en}
              />
            </div>
            <div className="col-md-6">
              <Input
                name={`documentTypesMultiLang[${i}].fr`}
                label={"French: " + translation.document_type}
                placeholder={translation.document_type_placeholder}
                required
                value={values?.documentTypesMultiLang?.[i]?.fr || ""}
                onChange={(value) =>
                  setFieldValue(`documentTypesMultiLang[${i}].fr`, value)
                }
                error={errors.documentTypesMultiLang?.[i]?.fr}
              />
            </div>
            <div className="col-md-12">
              <Input
                name={`documentTypesMultiLang[${i}].rw`}
                label={"Kinyarwanda: " + translation.document_type}
                placeholder={translation.document_type_placeholder}
                required
                value={values?.documentTypesMultiLang?.[i]?.rw || ""}
                onChange={(value) =>
                  setFieldValue(`documentTypesMultiLang[${i}].rw`, value)
                }
                error={errors.documentTypesMultiLang?.[i]?.rw}
              />
            </div>
            <div>
              <Button
                text={translation.delete}
                color={"red"}
                onClick={() => handleDelete(i)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleAddDocument = () => {
    // Create a new document object
    const newDocument: any = {
      en: "",
      fr: "",
      rw: "",
    };

    // Add the new document to the state
    setDocumentTypesMultiLang([...documentTypesMultiLang, newDocument]);
  };

  // handleDelete function to remove a document by index
  const handleDelete = (index: number) => {
    const updatedDocuments = [...documentTypesMultiLang];

    updatedDocuments.splice(index, 1);

    setDocumentTypesMultiLang(updatedDocuments);
  };

  return (
    <>
      <div className="card-body rs-modal-body">
        <div className="row">
          <div className="col-md-4">
            <Input
              name="name"
              label={`ENGLISH ${translation.name}`}
              placeholder={translation.name_placeholder}
              required
              value={values.engName}
              onChange={(value) => setFieldValue("engName", value)}
              error={errors.engName}
            />
          </div>
          <div className="col-md-4">
            <Input
              name="name"
              label={`FRENCH ${translation.name}`}
              placeholder={translation.name_placeholder}
              required
              value={values.frName}
              onChange={(value) => setFieldValue("frName", value)}
              error={errors.frName}
            />
          </div>
          <div className="col-md-4">
            <Input
              name="name"
              label={`KINYARWANDA ${translation.name}`}
              placeholder={translation.name_placeholder}
              required
              value={values.rwName}
              onChange={(value) => setFieldValue("rwName", value)}
              error={errors.rwName}
            />
          </div>
          <div className="col-md-12">
            <SelectDropdown
              options={fieldsSupportDocument.map((el) => {
                return {
                  label: el,
                  value: el,
                };
              })}
              name="fieldNames"
              label={translation.field_name}
              placeholder={translation.name_placeholder}
              required
              value={values.fieldNames}
              onChange={(value) => setFieldValue("fieldNames", value)}
              error={errors.fieldNames}
              leftIcon="description"
              isMulti
            />
          </div>
          <div className="mb-3">
            {documentTypesMultiLang.map((el: any, i: number) => {
              return renderDocument(i);
            })}
            <Button
              startIcon="add"
              text="Add document"
              appearance="default"
              onClick={handleAddDocument}
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
        />
      </Modal.Footer>
    </>
  );
}
