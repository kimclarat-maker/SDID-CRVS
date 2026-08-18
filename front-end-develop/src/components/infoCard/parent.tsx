import { LanguageContext } from "@/context/LanguageContext";
import { useContext } from "react";
import { FieldItem } from "./filedItem";

function Parent({
  type,
  name,
  idNumber,
  selectedInformation,
  handleCheckbox,
  isDefault,
  id_number,
}: {
  type: string;
  name: string;
  idNumber: string;
  selectedInformation?: string[];
  handleCheckbox?: (name: string) => void;
  isDefault?: boolean;
  id_number?: "";
}) {
  const { translation } = useContext(LanguageContext);
  return (
    <>
      <FieldItem
        isDefault={isDefault}
        title={`${translation[`${type?.toLowerCase()}_name`]}:`}
        value={name}
        selectedInformation={selectedInformation}
        handleCheckbox={handleCheckbox}
        fieldName={
          type.toUpperCase() === "FATHER" ? "fatherNames" : "motherNames"
        }
        disabled
      />
      <FieldItem
        title={`${translation[`${type?.toLowerCase()}_id_number`]}:`}
        value={idNumber || id_number}
        selectedInformation={selectedInformation}
        handleCheckbox={handleCheckbox}
        fieldName={
          type.toUpperCase() === "FATHER" ? "fatherIDNumber" : "motherIDNumber"
        }
        isDefault={isDefault}
        disabled
      />
    </>
  );
}

export default Parent;
