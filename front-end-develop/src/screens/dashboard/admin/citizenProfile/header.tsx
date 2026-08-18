import { LanguageContext } from "@/context/LanguageContext";
import { useContext } from "react";
import {
  DescriptionItem,
  DescriptionList,
} from "@/components/descriptionList";
import { StatusBadge } from "@/components/table/status/StatusBadge";

import React from "react";

interface Props {
  citizenNumber: string;
  prenrolmentCenter?: string;
  enrollmentCenter?: string;
  operator: string | null;
  type?: string;
  status: string;
  email: string | null;
  phoneNumber: string;
  identifier: string;
  preEnrollmentNumber: string;
}

const Header: React.FC<Props> = ({
  citizenNumber,
  prenrolmentCenter,
  enrollmentCenter,
  type,
  operator,
  status,
  email,
  phoneNumber,
  identifier,
  preEnrollmentNumber,
}) => {
  const { translation } = useContext(LanguageContext);
  return (
    <div className="card">
      <div className="card-body">
        <DescriptionList>
          <DescriptionItem label={translation.identifier} value={identifier} />
          <DescriptionItem
            label={translation.pre_enrollment_number}
            value={preEnrollmentNumber}
          />
          <DescriptionItem
            label={translation.phone_number}
            value={phoneNumber}
          />
          <DescriptionItem label={translation.email} value={email} />
          <DescriptionItem
            label={
              translation[
                type === "prenrollment"
                  ? "prenrollment_number"
                  : "enrollment_number"
              ]
            }
            value={citizenNumber}
          />
          {type === "prenrollment" && (
            <DescriptionItem
              label={translation.prenrollment_center}
              value={prenrolmentCenter}
            />
          )}
          {type === "enrollment" && (
            <DescriptionItem
              label={translation.enrollment_center}
              value={enrollmentCenter}
            />
          )}
          <DescriptionItem
            label={
              translation[
                type === "prenrollment" ? "operator" : "enrollment_officer"
              ]
            }
            value={operator}
          />
          <DescriptionItem
            label={translation.status}
            value={status && <StatusBadge label={status} status={status} />}
          />
        </DescriptionList>
      </div>
    </div>
  );
};

export default Header;
