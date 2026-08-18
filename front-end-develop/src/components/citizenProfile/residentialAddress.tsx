import Input from "@/components/input";
import { LanguageContext } from "@/context/LanguageContext";
import { EnrollmentType } from "@/types/Enrollment";
import { Prenrollment } from "@/types/Prenrollment";
import { RollBack } from "@/types/RollBack";
import React, { useContext } from "react";

interface Props {
  data: EnrollmentType | RollBack | Prenrollment;
}

const ResidentialAddress: React.FC<Props> = ({ data }) => {
  const { translation } = useContext(LanguageContext);
  return (
    <div className="row">
      <div className="col-md-3">
        <Input
          name="residentialCountry"
          label={translation.country}
          value={data?.residentialCountry?.name}
        />
      </div>
      <div className="col-md-3">
        <Input
          name="residentialProvince"
          label={translation.province}
          value={data?.residentialProvince?.name}
        />
      </div>
      <div className="col-md-3">
        <Input
          name="residentialDistrict"
          label={translation.district}
          value={data?.residentialDistrict?.name}
        />
      </div>
      <div className="col-md-3">
        <Input
          name="residentialSector"
          label={translation.sector}
          value={data?.residentialSector?.name}
        />
      </div>
      <div className="col-md-3">
        <Input
          name="residentialCell"
          label={translation.cell}
          value={data?.residentialCell?.name}
        />
      </div>
      <div className="col-md-3">
        <Input
          name="residentiaVillage"
          label={translation.village}
          value={data?.residentialVillage?.name}
        />
      </div>
    </div>
  );
};

export default ResidentialAddress;
