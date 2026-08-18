import { useContext } from "react";
import { Avatar } from "rsuite";
import "./styles.css";

import userPhotoPlaceholder from "@/assets/userPhotoPlaceholder.png";
import { LanguageContext } from "@/context/LanguageContext";
import { UserType } from "@/types/User";
import Input from "../input";

function Profile({
  _id,
  photo,
  firstName,
  lastName,
  email,
  phoneNumber,
  accountType,
  documentType,
  accessRole,
  center,
  showLogs,
  idNumber,
}: UserType) {
  const { translation } = useContext(LanguageContext);

  return (
    <>
      <Avatar
        src={photo || userPhotoPlaceholder}
        style={{ marginBottom: "1.5rem" }}
        size="xxl"
      >
        {firstName?.charAt(0)}
      </Avatar>
      <div className="row">
        <div className="col-md-6">
          <Input
            name="firstName"
            label={translation.first_name}
            value={firstName}
            disabled
          />
        </div>
        <div className="col-md-6">
          <Input
            name="lastName"
            label={translation.last_name}
            value={lastName}
            disabled
          />
        </div>
        <div className="col-md-6">
          <Input
            name="email"
            label={translation.email_address}
            value={email}
            disabled
          />
        </div>
        <div className="col-md-6">
          <Input
            name="idNumber"
            label={translation.id_number}
            value={idNumber || ""}
            disabled
          />
        </div>
        <div className="col-md-6">
          <Input
            name="phoneNumber"
            label={translation.phone_number}
            value={phoneNumber || ""}
            disabled
          />
        </div>
        {accountType && (
          <div className="col-md-6">
            <Input
              name="accountType"
              label={translation.account_type}
              value={accountType || ""}
              disabled
            />
          </div>
        )}
        {accessRole && (
          <div className={`col-md-6`}>
            <Input
              name="accessRole"
              label={translation.access_role}
              required
              value={accessRole.name}
              disabled
            />
          </div>
        )}

        {center && (
          <div className="col-md-6">
            <Input
              name="center"
              label={translation.center}
              value={center.name}
              disabled
            />
          </div>
        )}
        {documentType && (
          <div className={`col-md-6`}>
            <Input
              name="documentType"
              label={translation.document_type}
              value={documentType.map((doc: any) => doc.name).join(", ")}
              disabled
            />
          </div>
        )}
      </div>
    </>
  );
}

export default Profile;
