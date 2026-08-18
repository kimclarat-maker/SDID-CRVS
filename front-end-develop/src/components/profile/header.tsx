import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect, useState } from "react";
import Alert from "@/components/alert";
import React from "react";
import { ButtonToolbar, Heading, Stack, Tag, Text } from "rsuite";
import Button from "@/components/button";
import Modal from "@/components/Modal";
import EnrollmentProfile from "@/screens/dashboard/admin/citizenProfile/enrollment";
import { Link, useNavigate } from "react-router-dom";
import FacialAuth from "@/components/facialAuth";
import { useFetchEnrollments } from "@/hooks/useFetchEnrollments";
import moment from "moment";
import ChangeOfficer from "./changeOfficer";
import Loading from "../loader";
import { defineAccess } from "@/utils/common/permissions";
import { EnrollmentType } from "@/types/Enrollment";
import toastMessage from "@/utils/common/toastMessage";

interface Props {
  enrollmentStatus: string;
  enrollmentNumber: string;
  preEnrollmentNumber: string;
  preEnrollmentId: string;
  phoneNumber: string;
  enrollmentId?: any;
  setOpenRollBack?: (open: boolean) => void;
  preEnrollmentStatus?: string;
  biometricCaptureDate?: string;
  requestNumber?: string;
  selfieVerificationSkipStatus?: any;
  status?: string;
  photo: string;
  enableHeader?: boolean;
  from?: string;
  type?: string;
  isStartedOnline?: any;
  syncedToCentral?: boolean;
  selfieVerificationSkipRequestedAt?: string;
  showManualSendEN?: boolean;
  sdidCoreStatus?: string;
  syncedToCore?: boolean;
}

// Status constants for better maintainability
const STATUS = {
  ENROLLMENT_COMPLETED: "ENROLLMENT_COMPLETED",
  APPROVED: "APPROVED",
  SELFIE_VERIFICATION_PENDING: "SELFIE_VERIFICATION_PENDING",
  SELFIE_VERIFICATION_SKIPPED: "SELFIE_VERIFICATION_SKIPPED",
  ENROLLMENT_STARTED: "ENROLLMENT_STARTED",
  SELFIE_VERIFIED: "SELFIE_VERIFIED",
  NOT_STARTED: "NOT_STARTED",
  ROLLBACK: "ROLLBACK",
  REJECTED: "REJECTED"
} as const;

const SKIP_STATUS = {
  REJECTED: "REJECTED",
  PENDING: "PENDING"
} as const;

const Header: React.FC<Props> = ({
  enrollmentStatus,
  enrollmentNumber,
  preEnrollmentNumber,
  phoneNumber,
  preEnrollmentId,
  enrollmentId,
  setOpenRollBack,
  preEnrollmentStatus,
  biometricCaptureDate,
  requestNumber,
  selfieVerificationSkipStatus,
  status,
  photo,
  enableHeader,
  from,
  type,
  isStartedOnline,
  syncedToCentral,
  selfieVerificationSkipRequestedAt,
  sdidCoreStatus,
  syncedToCore
}) => {
  const { translation } = useContext(LanguageContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [openFacialModal, setOpenFacialModal] = useState(false);
  const [openOfficerModal, setOfficerModal] = useState(false);
  const { loading, data, fetchEnrollmentData } = useFetchEnrollments();
  const [isResuming, setIsResume] = useState(false);

  let normalizedEnrollmentStatus = enrollmentStatus?.toUpperCase();
  const normalizedPreEnrollmentStatus = preEnrollmentStatus?.toUpperCase();
  const normalizedSkipStatus = selfieVerificationSkipStatus?.toUpperCase();
  const normalizedStatus = status?.toUpperCase();
  const [enrollmentProfile, setEnrollmentProfile] = useState<EnrollmentType[]>(
    []
  );

  const onFetchEnrollment = async () => {
    if (preEnrollmentNumber) {
      const canUseOffline = defineAccess({
        method: "get",
        module: "offline"
      });
      const loginType = localStorage.getItem("loginType");
      fetchEnrollmentData(
        {
          preEnrollmentNo: preEnrollmentNumber
        },
        typeof isStartedOnline === "boolean" &&
          !isStartedOnline &&
          (loginType === "local" || loginType === '"local"') &&
          canUseOffline
          ? "OFFLINE"
          : "ONLINE"
      );
    }
  };

  useEffect(() => {
    setIsResume(false);
    if (type === "enrollmentNo" || !type) return;
    onFetchEnrollment();
  }, []);

  useEffect(() => {
    if (
      data?.length > 0 &&
      data?.[0]?.syncedToCentral &&
      data?.[0]?.status?.toUpperCase() === "APPROVED"
    ) {
      fetchEnrollmentData({
        preEnrollmentNo: preEnrollmentNumber
      });
    }

    setEnrollmentProfile(data);
  }, [data]);

  const onVerifyCitizenOnResume = () => {
    setIsResume(true);
    setOpenFacialModal(true);
  };

  const renderOfficer = () => {
    if (enrollmentProfile?.length === 0) return null;

    return (
      <Stack spacing={16}>
        <Stack.Item>
          <Text>
            {enrollmentProfile[0]?.officer?.first_name ||
              enrollmentProfile[0]?.officer?.firstName}{" "}
            {enrollmentProfile[0]?.officer?.last_name ||
              enrollmentProfile[0]?.officer?.lastName}
          </Text>
          <Text>
            {moment(enrollmentProfile[0]?.officer?.assigned_at).format("lll")}
          </Text>
        </Stack.Item>
        <Stack.Item>
          <Button
            text={translation.change}
            onClick={() => setOfficerModal(true)}
            appearance="ghost"
          />
        </Stack.Item>
      </Stack>
    );
  };

  // Helper functions for better readability
  const isCompletedOrApproved = () =>
    normalizedEnrollmentStatus === STATUS.ENROLLMENT_COMPLETED ||
    normalizedEnrollmentStatus === STATUS.APPROVED;

  const isSelfieVerificationPending = () =>
    normalizedEnrollmentStatus === STATUS.SELFIE_VERIFICATION_PENDING ||
    normalizedEnrollmentStatus === STATUS.SELFIE_VERIFICATION_SKIPPED;

  const canShowOfficerAndDetails = () =>
    // normalizedSkipStatus === STATUS.ENROLLMENT_COMPLETED &&
    (normalizedSkipStatus !== SKIP_STATUS.REJECTED &&
      isSelfieVerificationPending()) ||
    normalizedSkipStatus === SKIP_STATUS.PENDING;

  const canResumeEnrollment = () =>
    // normalizedEnrollmentStatus === STATUS.SELFIE_VERIFICATION_PENDING;
    normalizedEnrollmentStatus === STATUS.ENROLLMENT_STARTED ||
    normalizedEnrollmentStatus === STATUS.SELFIE_VERIFIED;

  const canStartEnrollment = () =>
    normalizedSkipStatus === SKIP_STATUS.REJECTED ||
    normalizedEnrollmentStatus === STATUS.NOT_STARTED;

  const getAlertType = () => (isCompletedOrApproved() ? "success" : "info");

  const getTagColor = () => {
    if (isCompletedOrApproved() || normalizedStatus === STATUS.APPROVED) {
      return "green";
    }
    if (normalizedPreEnrollmentStatus === STATUS.ROLLBACK) {
      return "blue";
    }
    if (normalizedPreEnrollmentStatus === STATUS.REJECTED) {
      return "red";
    }
    if (normalizedEnrollmentStatus === STATUS.NOT_STARTED) {
      return "cyan";
    }
    return "orange";
  };

  const getTagText = () => {
    if (normalizedPreEnrollmentStatus === STATUS.ROLLBACK) {
      return translation.roll_back;
    }

    if (normalizedPreEnrollmentStatus === STATUS.REJECTED) {
      return translation.rejected;
    }
    return translation[enrollmentStatus] || enrollmentStatus;
  };

  const renderButtonToolbar = () => {
    if (loading) return <Loading />;
    if (normalizedPreEnrollmentStatus === STATUS.ROLLBACK) return null;

    return (
      <Stack.Item>
        <ButtonToolbar>
          {canStartEnrollment() && status?.toUpperCase() !== "REJECTED" ? (
            <>
              <Button
                text={translation.roll_back}
                onClick={() => setOpenRollBack?.(true)}
                appearance="ghost"
              />
              <Button
                text={translation.start_enrollment}
                onClick={() => setOpenFacialModal(true)}
              />
            </>
          ) : canShowOfficerAndDetails() ? (
            <>
              {renderOfficer()}
              <Button
                text={translation.roll_back}
                onClick={() => setOpenRollBack?.(true)}
                appearance="ghost"
              />
              <Button
                text={translation.resume}
                loading={loading}
                onClick={onVerifyCitizenOnResume}
                appearance="ghost"
              />
              <Button
                text={translation.view_details}
                onClick={() => {
                  navigate(
                    `/dashboard/admin/request/exceptions/prenrollment/${preEnrollmentNumber}?isStartedOnline=${isStartedOnline}`
                  );
                }}
              />
            </>
          ) : canResumeEnrollment() ? (
            <>
              {renderOfficer()}
              <Button
                text={translation.roll_back}
                onClick={() => setOpenRollBack?.(true)}
                appearance="ghost"
              />
              {selfieVerificationSkipRequestedAt &&
                selfieVerificationSkipRequestedAt !== "" && (
                  <Button
                    text={translation.view_details}
                    onClick={() => {
                      navigate(
                        `/dashboard/admin/request/exceptions/prenrollment/${preEnrollmentNumber}?isStartedOnline=${isStartedOnline}`
                      );
                    }}
                  />
                )}
              <Button
                text={translation.resume}
                loading={loading}
                onClick={onVerifyCitizenOnResume}
              />
            </>
          ) : type &&
            (normalizedEnrollmentStatus === STATUS.ENROLLMENT_COMPLETED ||
              normalizedEnrollmentStatus === STATUS.APPROVED) ? (
            <>
              <Button
                text={translation.view_enrollment_profile}
                onClick={() =>
                  navigate(
                    `/dashboard/admin/enrollment/${
                      enrollmentId ? enrollmentId : enrollmentProfile[0]?._id
                    }?from=${isStartedOnline ? "online" : "local"}`
                  )
                }
                loading={loading}
              />
            </>
          ) : null}
        </ButtonToolbar>
      </Stack.Item>
    );
  };

  return (
    <>
      <Alert type={getAlertType()}>
        <Stack>
          <Stack.Item grow={1}>
            {enableHeader && (
              <>
                <Heading>{enrollmentNumber || preEnrollmentNumber}</Heading>
                {biometricCaptureDate && (
                  <>
                    <Text>{moment(biometricCaptureDate).format("lll")}</Text>
                    <br />
                  </>
                )}
              </>
            )}
            <Tag color={getTagColor()}>{getTagText()}</Tag>
            {syncedToCentral && <Tag color="cyan">{translation.synced}</Tag>}
            {sdidCoreStatus && (
              <Tag
                color={
                  sdidCoreStatus === "ACCEPTED"
                    ? "green"
                    : sdidCoreStatus === "REJECTED"
                    ? "red"
                    : sdidCoreStatus === "PROCESSING"
                    ? "orange"
                    : "cyan"
                }
              >
                {sdidCoreStatus === "ACCEPTED"
                  ? translation.synced_to_core
                  : sdidCoreStatus === "REJECTED"
                  ? `Rejected (Core)`
                  : sdidCoreStatus === "PROCESSING"
                  ? `Processing (Core)`
                  : sdidCoreStatus}
              </Tag>
            )}
            {!sdidCoreStatus && syncedToCore && (
              <Tag color="cyan">{translation.synced_to_core}</Tag>
            )}
          </Stack.Item>
          {renderButtonToolbar()}
        </Stack>
      </Alert>

      <Modal show={open} handleClose={() => setOpen(false)}>
        <div className="rs-modal-body">
          <EnrollmentProfile
            type="enrollment"
            preEnrollmentNumber={preEnrollmentNumber}
          />
        </div>
      </Modal>

      <Modal
        show={openFacialModal}
        handleClose={() => setOpenFacialModal(false)}
        title={preEnrollmentNumber}
        size="xs"
      >
        <FacialAuth
          setOpen={setOpenFacialModal}
          prenrollmentId={preEnrollmentId}
          preEnrollmentNo={preEnrollmentNumber}
          phoneNumber={phoneNumber}
          resumeId={data?.[0]?._id || undefined}
          photo={photo}
          isResuming={isResuming}
          requestNumber={requestNumber}
          isStartedOnline={isStartedOnline}
        />
      </Modal>

      <Modal
        show={openOfficerModal}
        handleClose={() => setOfficerModal(false)}
        title={translation.change_officer}
        size="xs"
      >
        <div className="rs-modal-body">
          {enrollmentProfile.length > 0 && (
            <ChangeOfficer
              fetchData={onFetchEnrollment}
              enrollmentId={enrollmentProfile[0]?._id}
              accountId={enrollmentProfile?.[0]?.officer?._id}
              setOfficerModal={setOfficerModal}
            />
          )}
        </div>
      </Modal>
    </>
  );
};

export default Header;
