import React, { useState } from "react";
import Header from "../../../../components/profile/header";
import { Prenrollment } from "@/types/Prenrollment";
import Modal from "@/components/Modal";
import FacialAuth from "@/components/facialAuth";
import EnrollmentStatus from "./enrollmentStatus";
import CitizenProfile from "@/components/profile/citizenProfile";
import RollBackForm from "@/components/forms/rollBack";

interface Props {
  data: Prenrollment;
  enrollmentStatus: string;
  fetchData: () => void;
  from?: string;
  type: string;
}

const Profile: React.FC<Props> = ({
  data,
  enrollmentStatus,
  from,
  fetchData,
  type,
}) => {
  const [openModal, setOpenModal] = useState(false);
  const [openRollBackModal, setOpenRollBack] = useState(false);

  const renderEmpty = () => {
    return <></>;
  };

  if (Object.keys(data).length === 0) {
    return renderEmpty();
  }

  const renderHeader = () => {
    return (
      <Header
        preEnrollmentNumber={data.preEnrollmentNumber}
        enrollmentStatus={data.enrollmentStatus || data.status}
        enrollmentNumber={data.enrollmentNumber}
        preEnrollmentId={data._id}
        phoneNumber={data.phoneNumber}
        photo={data.selfie}
        setOpenRollBack={setOpenRollBack}
        preEnrollmentStatus={data.status}
        requestNumber={data.requestNo}
        selfieVerificationSkipStatus={data.selfieVerificationSkipStatus}
        status={data.status}
        enableHeader
        from={from}
        type={type}
        enrollmentId={type === "enrollmentNo" ? data._id : null}
        selfieVerificationSkipRequestedAt={
          data.selfieVerificationSkipRequestedAt || ""
        }
        isStartedOnline={
          typeof data.isStartedOnline === "boolean"
            ? data.isStartedOnline
            : null
        }
      />
    );
  };

  return (
    <>
      {renderHeader()}
      <br />
      <CitizenProfile data={data} />

      {renderHeader()}

      <Modal
        show={openModal}
        handleClose={() => setOpenModal(false)}
        title={data.preEnrollmentNumber}
        size="xs"
      >
        <FacialAuth
          setOpen={setOpenModal}
          prenrollmentId={data._id}
          preEnrollmentNo={data.preEnrollmentNumber}
          phoneNumber={data.phoneNumber}
          requestNumber={data.requestNo}
          photo={data.photo || ""}
        />
      </Modal>

      <Modal
        show={openRollBackModal}
        handleClose={() => setOpenRollBack(false)}
        title={data.preEnrollmentNumber}
      >
        <RollBackForm setOpen={setOpenRollBack} preEnrollmentId={data._id} />
      </Modal>

      {enrollmentStatus && <EnrollmentStatus status={enrollmentStatus} />}
    </>
  );
};

export default Profile;
