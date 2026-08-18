import Input from "@/components/input";
import { LanguageContext } from "@/context/LanguageContext";
import { EnrollmentType } from "@/types/Enrollment";
import { Prenrollment } from "@/types/Prenrollment";
import { RollBack } from "@/types/RollBack";
import React, { useContext } from "react";

interface Props {
  data: EnrollmentType | RollBack | Prenrollment;
}

const Parent: React.FC<Props> = ({ data }) => {
  const { translation } = useContext(LanguageContext);
  return (
    <div className="row">
      <div className="col-md-12">
        <div className="row">
          <div className="col-md-6">
            <Input
              name="fatherName"
              label={translation.fatherName}
              value={data?.fatherNames}
              disabled
            />
          </div>
          <div className="col-md-6">
            <Input
              name="fatherIdNumber"
              label={translation.fatherIDNumber}
              value={data?.fatherIDNumber}
              disabled
            />
          </div>
        </div>
      </div>
      <div className="col-md-12">
        <div className="row">
          <div className="col-md-6">
            <Input
              name="motherName"
              label={translation.motherName}
              value={data?.motherNames}
              disabled
            />
          </div>
          <div className="col-md-6">
            <Input
              name="motherIDNumber"
              label={translation.motherIDNumber}
              value={data?.motherIDNumber}
              disabled
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Parent;
