import Input from "@/components/input";
import { LanguageContext } from "@/context/LanguageContext";
import { useContext } from "react";

const Identifiation = ({
  identifier,
  type,
  applicationNumber,
  applicantCategory,
  citizenshipStatus,
  documentType,
  enrollmentNumber,
  requestNo,
  isDiplomat
}: {
  identifier?: string;
  type?: string;
  applicationNumber?: string;
  applicantCategory?: string;
  citizenshipStatus?: string;
  documentType?: string;
  enrollmentNumber?: string;
  requestNo?: string;
  isDiplomat?: boolean;
}) => {
  const { translation } = useContext(LanguageContext);

  if (type === "prenrollment") {
    return (
      <div className="row">
        <div className="col-md-3">
          <Input
            name="identifier"
            value={identifier}
            label={translation.identifier}
            disabled
          />
        </div>
        <div className="col-md-3">
          <Input
            name="requestNo"
            value={requestNo}
            label={translation.request_number}
            disabled
          />
        </div>
        <div className="col-md-3">
          <Input
            name="applicationCategory"
            value={applicantCategory}
            label={translation.application_category}
            disabled
          />
        </div>
        <div className="col-md-3">
          <Input
            name="citizenship"
            value={citizenshipStatus}
            label={translation.citizenship_status}
            disabled
          />
        </div>
        <div className="col-md-3">
          <Input
            name="documentType"
            value={documentType}
            label={translation.document_type}
            disabled
          />
        </div>
        {isDiplomat && (
          <div className="col-md-3">
            <Input
              name="isDiplomat"
              value={isDiplomat}
              label={translation.diplomat}
              disabled
            />
          </div>
        )}
      </div>
    );
  }
  return (
    <Input
      name="sdidNumber"
      value={enrollmentNumber}
      label={translation.sdid_number}
      containerStyles={{ marginBottom: 0 }}
    />
  );
};

export default Identifiation;
