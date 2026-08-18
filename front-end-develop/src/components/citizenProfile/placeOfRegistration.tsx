import Input from "@/components/input";
import { LanguageContext } from "@/context/LanguageContext";
import { EnrollmentType } from "@/types/Enrollment";
import { Prenrollment } from "@/types/Prenrollment";
import { RollBack } from "@/types/RollBack";
import React, { useContext } from "react";

interface Props {
  data: EnrollmentType | RollBack | Prenrollment;
}

const PlaceOfRegistration: React.FC<Props> = ({ data }) => {
  const { translation } = useContext(LanguageContext);
  return (
    <div className="row">
      <div className="col-md-3">
        <Input
          name="country"
          label={translation.country}
          value={data?.country}
        />
      </div>
      <div className="col-md-3">
        <Input
          name="province"
          label={translation.province}
          value={data?.province}
        />
      </div>
      <div className="col-md-3">
        <Input name="sector" label={translation.sector} value={data?.sector} />
      </div>
      <div className="col-md-3">
        <Input name="sector" label={translation.sector} value={data?.sector} />
      </div>
      <div className="col-md-3">
        <Input name="cell" label={translation.cell} value={data?.cell} />
      </div>
      <div className="col-md-3">
        <Input
          name="village"
          label={translation.village}
          value={data?.village}
        />
      </div>
    </div>
  );
};

export default PlaceOfRegistration;
