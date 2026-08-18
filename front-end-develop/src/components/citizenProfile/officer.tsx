import Input from "@/components/input";
import { LanguageContext } from "@/context/LanguageContext";
import { EnrollmentType } from "@/types/Enrollment";
import { Prenrollment } from "@/types/Prenrollment";
import { RollBack } from "@/types/RollBack";
import React, { useContext } from "react";

interface Props {
  data: EnrollmentType | RollBack | Prenrollment;
}

const Officer: React.FC<Props> = ({ data }) => {
  const { translation } = useContext(LanguageContext);

  return (
    <div className="row">
      <div className="col-md-6">
        <Input
          name="spouseName"
          label={translation.spouse}
          value={data?.spouse}
          disabled
        />
      </div>
      <div className="col-md-6">
        <Input
          name="spouseIdNumber"
          label={translation.spouseIDNumber}
          value={data?.spouseIDNumber}
          disabled
        />
      </div>
    </div>
  );
};

export default Officer;
