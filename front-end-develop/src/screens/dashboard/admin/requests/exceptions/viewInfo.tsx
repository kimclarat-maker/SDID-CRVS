import Button from "@/components/button";
import { useContext, useEffect, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import Modal from "@/components/Modal";
import {
  Modal as LibModal,
  Stack,
  Tag,
  TagGroup,
  Text,
  Panel,
  Message,
  ButtonToolbar,
  PanelGroup,
  List
} from "rsuite";
import StackItem from "rsuite/esm/Stack/StackItem";
import moment from "moment";
import Empty from "@/components/empty";
import toastMessage from "@/utils/common/toastMessage";
import capitalizeText from "@/utils/common/capitalizeText";
import Input from "@/components/input";
import {
  convertCountryCodeToName,
  formateNationality
} from "@/utils/common/countryNameFormat";
import Alert from "@/components/alert";
import {
  pairValidatorSkipRequestCode,
  pairValidatorSkipSelfie,
  pairValidatorVerifySkipSelfieCode,
  skipSelfie,
  verifySkipSelfieCode
} from "@/api/skipSelfie";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchEnrollments, onStart } from "@/api/enrollments";
import { accessRoleName, defineAccess } from "@/utils/common/permissions";
import { applicantSelfieMatch } from "@/api/selfie";
import { useLocalService } from "@/context/LocalServiceContext";
import FacialAuth from "@/components/facialAuth";
import Checkbox from "@/components/checkbox";
import { getStorage } from "@/utils/storage";

export const ViewInfo = ({
  open,
  setOpen,
  data,
  preEnrollmentId,
  setRefresh,
  isPairValidator,
  enrollmentId,
  accountId,
  type,
  isBioRefresh,
  isStartedOnline: isStartedOnlineProp
}: {
  open: boolean;
  setOpen: (e: boolean) => void;
  data: any;
  preEnrollmentId?: string;
  setRefresh: (e: boolean) => void;
  isPairValidator?: boolean;
  enrollmentId?: string;
  accountId?: string;
  type?: string;
  isBioRefresh?: boolean;
  isStartedOnline?: boolean;
}) => {
  const { translation } = useContext(LanguageContext);

  const [submitting, setSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [action, setAction] = useState("");
  const [rejectComment, setRejectComment] = useState("");
  const [error, setError] = useState<any>({});
  const [skipVerificationCode, setCode] = useState("");
  const navigate = useNavigate();
  const [needToBeVerified, setNeedToBeVerified] = useState(false);
  const [isResending, setResending] = useState(false);
  const roleName = accessRoleName();
  const allowedRoles = ["superAdmin", "admin"];
  const { isOnline } = useLocalService();
  const [activeKey, setActiveKey] = useState("1");
  const [selfieMandatory, setSelfieMandatory] = useState(false);
  const [showFacialAuth, setShowFacialAuth] = useState(false);
  const [searchParams] = useSearchParams();
  const [isDiplomat, setDiplomat] = useState(false);

  const isStartedOnline =
    isStartedOnlineProp || searchParams.get("isStartedOnline") === "true";

  useEffect(() => {
    setNeedToBeVerified(false);
  }, [open]);

  useEffect(() => {
    if (
      data?.selfieVerificationSkipStatus?.toUpperCase() === "APPROVED" ||
      data?.approverSelfieSkipStatus?.toUpperCase() === "APPROVED" ||
      data?.selfieVerificationSkipStatus?.toUpperCase() ===
        "SKIP_SELFIE_APPROVED"
    ) {
      setNeedToBeVerified(true);
    }
  }, [data, needToBeVerified]);

  // useEffect(() => {
  //   if (isPairValidator && data.approverSelfieSkipCode !== "") {
  //     setCode(data.approverSelfieSkipCode);
  //     setError("");
  //   } else if (data.selfieVerificationSkipCode !== "") {
  //     setCode(data.selfieVerificationSkipCode || "");

  //     setError("");
  //   }
  // }, [data]);

  useEffect(() => {
    handleVerifyOTP();
  }, [skipVerificationCode]);

  const renderItem = ({
    title,
    value,
    type
  }: {
    title: string;
    value: string;
    type?: string;
  }) => {
    const itemStyles = {
      marginBottom: "0.5rem",
      backgroundColor: `var(--bg-color)`,
      padding: "1rem",
      borderRadius: 8
    };
    if (type === "status") {
      return (
        <div style={itemStyles}>
          <Stack>
            <StackItem grow={1}>{title}:</StackItem>
            <StackItem>
              <TagGroup>
                <Tag>
                  <Text className="textBold">{value}</Text>
                </Tag>
              </TagGroup>
            </StackItem>
          </Stack>
        </div>
      );
    }
    if (type === "date") {
      return (
        <div style={itemStyles}>
          <Stack>
            <StackItem grow={1}>
              <Text>{title}</Text>
            </StackItem>
            <StackItem>
              <Text className="textBold">{moment(value).format("lll")}</Text>
            </StackItem>
          </Stack>
        </div>
      );
    }
    return (
      <div style={itemStyles}>
        <Stack>
          <StackItem grow={1}>
            <Text>{title}</Text>
          </StackItem>
          <StackItem>
            <Text className="textBold">{value}</Text>
          </StackItem>
        </Stack>
      </div>
    );
  };

  const onSendOTP = async () => {
    setSubmitting(true);
    setNeedToBeVerified(false);

    try {
      if (!preEnrollmentId)
        return toastMessage(
          "error",
          translation.missing_field + ": preEnrollmentId"
        );
      const data = await skipSelfie({
        preEnrollmentId,
        isApproved: true,
        isStartedOnline
      });

      toastMessage("success", data.message);

      setSubmitting(false);

      setRefresh(true);

      setConfirmModal(false);
    } catch (error: any) {
      toastMessage("error", error);

      if (error?.response?.data?.message?.includes("OTP is not expired")) {
        setNeedToBeVerified(true);
      }

      setSubmitting(false);
    }
  };

  const onSendOTPPairValidator = async () => {
    setSubmitting(true);
    setNeedToBeVerified(false);

    try {
      if (!enrollmentId)
        return toastMessage(
          "error",
          translation.missing_field + ": enrollmentId"
        );

      if (!accountId)
        return toastMessage("error", translation.missing_field + ": accountId");

      const data = await pairValidatorSkipSelfie(
        enrollmentId,
        true,
        isBioRefresh,
        isStartedOnline
      );

      toastMessage("success", data.message);

      setSubmitting(false);

      setRefresh(true);
    } catch (error: any) {
      toastMessage("error", error);

      if (error?.response?.data?.message?.includes("OTP is not expired")) {
        setNeedToBeVerified(true);
      }

      setSubmitting(false);
    }
  };

  const handleSendOTP = async () => {
    console.log("isPairValidator", isPairValidator);
    if (isPairValidator) return onSendOTPPairValidator();
    onSendOTP();
  };

  const onReject = async (preEnrollmentId: string) => {
    setSubmitting(true);
    setNeedToBeVerified(false);

    try {
      const data = await skipSelfie({
        preEnrollmentId,
        isApproved: false,
        isStartedOnline
      });

      toastMessage("success", data.message);

      setSubmitting(false);

      setRefresh(true);
    } catch (error) {
      toastMessage("error", error);

      setSubmitting(false);
    }
  };

  const onVerify = async () => {
    try {
      if (!preEnrollmentId)
        return toastMessage(
          "error",
          translation.missing_field + ": preEnrollmentId"
        );

      if (
        skipVerificationCode === "" ||
        !skipVerificationCode ||
        skipVerificationCode?.length !== 6
      ) {
        return setError({ skipVerificationCode: translation.enter_otp_code });
      }

      if (skipVerificationCode.length < 6) return;
      setSubmitting(true);
      const data = await verifySkipSelfieCode(
        preEnrollmentId,
        skipVerificationCode,
        isStartedOnline
      );

      toastMessage("success", data.message);

      // if (data.enrollmentId) {
      //   if (isStartedOnline) {
      //     return navigate(
      //       `/dashboard/admin/enrollment/biometrics/start/${data.enrollmentId}/${data.bioToken}?isStartedOnline=true`
      //     );
      //   }
      //   return navigate(
      //     `/dashboard/admin/enrollment/biometrics/start/${data.enrollmentId}/${data.bioToken}`
      //   );
      // }

      if (data.enrollmentId) {
        let link = `/dashboard/admin/enrollment/biometrics/start/${data.enrollmentId}/${data.bioToken}`;

        if (isStartedOnline) {
          if (isDiplomat) {
            link = `${link}?isRemoteFetch=true&isDiplomat=true`;
          } else {
            link = `${link}?isRemoteFetch=true`;
          }
        } else if (isDiplomat) {
          link = `${link}?isDiplomat=true`;
        }
        return navigate(link);
      }

      await handleStartEnrollment(data.bioToken);

      setSubmitting(false);
      setConfirmModal(false);
    } catch (error: any) {
      console.log("I am here 3");
      toastMessage("error", error);

      setSubmitting(false);
    }
  };

  const onVerifyPairValidator = async () => {
    try {
      if (
        skipVerificationCode === "" ||
        !skipVerificationCode ||
        skipVerificationCode?.length !== 6
      ) {
        return setError({ skipVerificationCode: translation.enter_otp_code });
      }

      if (!enrollmentId)
        return toastMessage(
          "error",
          translation.missing_field + ": enrollmentId"
        );

      if (skipVerificationCode.length < 6) return;
      setSubmitting(true);
      const data = await pairValidatorVerifySkipSelfieCode(
        enrollmentId,
        skipVerificationCode,
        isBioRefresh,
        isStartedOnline
      );

      toastMessage("success", data.message);

      setSubmitting(false);

      setConfirmModal(false);

      if (isStartedOnline) {
        return navigate(
          `/dashboard/admin/enrollment/${enrollmentId}?isStartedOnline=true`
        );
      }
      navigate(`/dashboard/admin/enrollment/${enrollmentId}`);
    } catch (error: any) {
      toastMessage("error", error);

      setSubmitting(false);
    }
  };

  const handleStartEnrollment = async (bioToken: string) => {
    try {
      if (!preEnrollmentId) return;

      const startEnrollment = await onStart({
        preEnrollmentId: preEnrollmentId,
        bioToken,
        isStartedOnline,
        payload: {
          isDiplomat
        }
      });

      let link = `/dashboard/admin/enrollment/biometrics/start/${startEnrollment.enrollmentId}/${startEnrollment.bioToken}`;

      if (isStartedOnline) {
        if (isDiplomat) {
          link = `${link}?isRemoteFetch=true&isDiplomat=true`;
        } else {
          link = `${link}?isRemoteFetch=true`;
        }
        return navigate(link);
      } else if (isDiplomat) {
        link = `${link}?isDiplomat=true`;
      }
      navigate(link);

      // if (isStartedOnline) {
      //   return navigate(
      //     `/dashboard/admin/enrollment/biometrics/start/${startEnrollment.enrollmentId}/${startEnrollment.bioToken}?isStartedOnline=true`
      //   );
      // }

      // navigate(
      //   `/dashboard/admin/enrollment/biometrics/start/${startEnrollment.enrollmentId}/${startEnrollment.bioToken}`
      // );
    } catch (error: any) {
      console.log("start enrollment error", error);

      // if (error?.response?.data?.message?.includes("already exists")) {
      //   await getEnrollmentByPrenrollmentNo(data.preEnrollmentNumber);
      // }
      setSubmitting(false);
    }
  };

  const getEnrollmentByPrenrollmentNo = async (preEnrollmentNo: string) => {
    const responseData: any = await fetchEnrollments({
      preEnrollmentNo
    });

    if (responseData.data?.length === 0) return;

    navigate(
      `/dashboard/admin/enrollment/biometrics/start/${responseData.data[0]._id}`
    );
  };

  const handleVerifyOTP = async () => {
    if (needToBeVerified && skipVerificationCode?.length === 6) {
      if (isPairValidator) {
        await onVerifyPairValidator();

        return;
      }
      await onVerify();
    }
  };

  const onResendCode = async () => {
    try {
      setResending(true);
      setSelfieMandatory(false);

      if (isPairValidator && enrollmentId && accountId) {
        const response = await pairValidatorSkipRequestCode(
          enrollmentId,
          accountId,
          data.approverSelfieForSkip,
          isBioRefresh,
          isStartedOnline
        );

        toastMessage("success", response.message);
        setResending(false);
        setRefresh(true);

        return;
      }

      if (preEnrollmentId) {
        const response = await applicantSelfieMatch({
          image: data.selfieForSkip,
          preEnrollmentId: data._id,
          phoneNumber: data.phoneNumber,
          skipSelfieVerification: true,
          isStartedOnline
        });

        toastMessage("success", response.message);
      }

      setResending(false);
      setSelfieMandatory(false);
    } catch (error: any) {
      if (
        error.response.data.message
          ?.toUpperCase()
          .includes("SELFIE MUST BE A STRING")
      ) {
        setSelfieMandatory(true);
        setConfirmModal(false);
      }

      toastMessage("error", error);
      setResending(false);
    }
  };

  const canUseDiplomat = defineAccess({
    method: "POST",
    module: "diplomat"
  });

  if (!data || (data && !data._id)) {
    return <Empty title={translation.no_data} />;
  }

  return (
    <>
      <Modal
        show={open}
        handleClose={() => setOpen(false)}
        title={translation.applicant_information}
      >
        <div
          className="rs-modal-body"
          style={{ overflowY: "auto", maxHeight: "70vh" }}
        >
          <Stack wrap spacing={8}>
            <StackItem style={{ marginBottom: "1rem" }}>
              {type === "account" ? (
                <Panel bordered header={translation.photo}>
                  <div className="user-img">
                    <img src={data?.photo} />
                  </div>
                </Panel>
              ) : (
                <Panel bordered header={translation.selfie}>
                  <div className="user-img">
                    <img src={data?.selfie} />
                  </div>
                </Panel>
              )}
            </StackItem>
            {data?.selfieForSkip && (
              <StackItem style={{ marginBottom: "1rem" }}>
                <Panel bordered header={translation.selfie_for_skip}>
                  <div className="user-img">
                    <img src={data?.selfieForSkip} />
                  </div>
                </Panel>
              </StackItem>
            )}
            {data?.approverSelfieForSkip && (
              <StackItem style={{ marginBottom: "1rem" }}>
                <Panel bordered header={translation.selfie_for_skip}>
                  <div className="user-img">
                    <img src={data?.approverSelfieForSkip} height={180} />
                  </div>
                </Panel>
              </StackItem>
            )}
          </Stack>

          {
            <div>
              {data.rejectComment && (
                <div className="mb-2">
                  <Alert message={data.rejectComment} type="error" />
                </div>
              )}
            </div>
          }
          <PanelGroup
            bordered
            accordion
            activeKey={activeKey}
            onSelect={(eventKey) => {
              if (eventKey !== undefined) setActiveKey(String(eventKey));
            }}
          >
            <Panel header={translation.personal_information} eventKey="1">
              {!isPairValidator && (
                <div>
                  {data.documentType &&
                    renderItem({
                      title: translation.document_type,
                      value: data.documentType
                    })}
                </div>
              )}
              <div>
                {data.applicantCategory &&
                  renderItem({
                    title: translation.applicant_category,
                    value: data.applicantCategory
                  })}
              </div>

              <div>
                {data.selfieVerificationSkipPhoneNumber &&
                  renderItem({
                    title: translation.phone_number,
                    value: data.selfieVerificationSkipPhoneNumber || ""
                  })}
              </div>
              <div>
                {data.identifier &&
                  renderItem({
                    title: translation.identifier,
                    value: data.identifier
                  })}
              </div>

              <div>
                {data.createdAt &&
                  renderItem({
                    title: translation.date,
                    value: data.createdAt,
                    type: "date"
                  })}
              </div>
              {data?.idNumber && (
                <>
                  <div>
                    {renderItem({
                      title: translation.id_number,
                      value: data.idNumber
                    })}
                  </div>
                </>
              )}
              <div>
                {renderItem({
                  title: translation.surname,
                  value: data.firstName
                })}
              </div>
              <div>
                {renderItem({
                  title: translation.post_name,
                  value: data.lastName
                })}
              </div>
              <div>
                {data.gender &&
                  renderItem({
                    title: translation.gender,
                    value: data.gender
                  })}
              </div>
              <div>
                {data.email &&
                  renderItem({
                    title: translation.email,
                    value: data.email
                  })}
              </div>
              <div>
                {data.phoneNumber &&
                  renderItem({
                    title: translation.phone_number,
                    value: data.phoneNumber
                  })}
              </div>
              <div>
                {data.dob &&
                  renderItem({
                    title: translation.dob,
                    value: data.dob
                  })}
              </div>
              <div>
                {data.placeOfBirth &&
                  renderItem({
                    title: translation.placeOfBirth,
                    value: convertCountryCodeToName(data.placeOfBirth)
                  })}
              </div>
              <div>
                {data.countryOfBirth &&
                  renderItem({
                    title: translation.country_of_birth,
                    value: convertCountryCodeToName(data.countryOfBirth || "")
                  })}
              </div>
              <div>
                {data.nationality &&
                  renderItem({
                    title: translation.nationality,
                    value: formateNationality(data.nationality)
                  })}
              </div>
              <div>
                {data.countryOfDomicile &&
                  renderItem({
                    title: translation.countryOfDomicile,
                    value: formateNationality(data.countryOfDomicile)
                  })}
              </div>
            </Panel>

            <Panel header={translation.residential_address} eventKey="2">
              <div>
                {data.province &&
                  renderItem({
                    title: translation.province,
                    value: data.province || ""
                  })}
              </div>
              <div>
                {data.district &&
                  renderItem({
                    title: translation.district,
                    value: data.district || ""
                  })}
              </div>
              <div>
                {data.sector &&
                  renderItem({
                    title: translation.sector,
                    value: data.sector || ""
                  })}
              </div>
              <div>
                {data.cell &&
                  renderItem({
                    title: translation.cell,
                    value: data.cell || ""
                  })}
              </div>
              <div>
                {data.village &&
                  renderItem({
                    title: translation.village,
                    value: data.village || ""
                  })}
              </div>
            </Panel>

            <Panel header={translation.parent_information} eventKey="3">
              <div>
                {data.fatherNames &&
                  renderItem({
                    title: translation.father_name,
                    value: data.fatherNames || ""
                  })}
              </div>

              <div>
                {data.motherNames &&
                  renderItem({
                    title: translation.mother_name,
                    value: data.motherNames || ""
                  })}
              </div>
            </Panel>

            <Panel header={translation.spouse_information} eventKey="4">
              <div>
                {data.spouse &&
                  renderItem({
                    title: translation.spouse,
                    value: data.spouse || ""
                  })}
              </div>
            </Panel>

            <Panel
              header={translation.digital_ambassador_information}
              eventKey="5"
            >
              <div>
                {data.digitalAmbassadorNid &&
                  renderItem({
                    title: translation.done_by,
                    value: data.digitalAmbassadorNid || ""
                  })}
              </div>
              <div>
                {data?.digitalAmbassador?.first_name &&
                  renderItem({
                    title: translation.names,
                    value: `${data?.digitalAmbassador?.first_name} ${data?.digitalAmbassador?.last_name}`
                  })}
              </div>
              <div>
                {data?.digitalAmbassador?.center_name &&
                  renderItem({
                    title: translation.center,
                    value: `${data?.digitalAmbassador?.center_name}`
                  })}
              </div>
              <div>
                {data?.digitalAmbassador?.center_location &&
                  renderItem({
                    title: translation.address,
                    value: `${data?.digitalAmbassador?.center_location}`
                  })}
              </div>
            </Panel>
          </PanelGroup>
        </div>
        <div style={{ marginBottom: "1rem" }} />
        <hr />
        <div style={{ marginBottom: "1rem" }} />
        {data.status === "REJECTED" && (
          <div style={{ marginBottom: "1rem" }}>
            <Message type="warning" showIcon bordered>
              {translation.reject_approve_message}
            </Message>
          </div>
        )}

        <LibModal.Footer>
          <Stack wrap spacing={16}>
            <Stack.Item>
              <ButtonToolbar>
                <Button
                  text={capitalizeText(translation.cancel)}
                  onClick={() => setOpen(false)}
                  appearance="default"
                />
              </ButtonToolbar>
            </Stack.Item>
            <Stack.Item grow={1}></Stack.Item>
            <Stack.Item>
              {allowedRoles.includes(roleName) &&
              (data.selfieVerificationSkipStatus === "PENDING" ||
                data.approverSelfieSkipStatus?.toUpperCase() === "PENDING" ||
                data.selfieVerificationSkipStatus === "VERIFIED" ||
                data.approverSelfieSkipStatus?.toUpperCase() === "VERIFIED") ? (
                <>
                  <Button
                    text={capitalizeText(translation.reject)}
                    onClick={() => {
                      setConfirmModal(true);
                      setAction("reject");
                      setOpen(false);
                    }}
                    color="red"
                  />
                  {isOnline && (
                    <Button
                      text={translation.approve}
                      onClick={() => {
                        setConfirmModal(true);
                        setOpen(false);
                        setAction("approve");
                      }}
                    />
                  )}
                </>
              ) : (
                data.selfieVerificationSkipStatus !== "REJECTED" &&
                data.selfieVerificationSkipStatus !== "VERIFIED" && (
                  <Button
                    text={translation.verify}
                    onClick={() => {
                      setConfirmModal(true);
                      setOpen(false);
                      setAction("approve");

                      if (data?.skipVerificationCode?.length === 6) {
                        setCode(
                          data?.skipVerificationCode ||
                            data?.pairValidatorSkipRequestCode
                        );
                      }
                    }}
                  />
                )
              )}
            </Stack.Item>
          </Stack>
        </LibModal.Footer>
      </Modal>

      <Modal
        show={confirmModal}
        handleClose={() => setConfirmModal(false)}
        title={translation.confirm}
      >
        <div className="rs-modal-body">
          <Text>{translation.are_you_sure}</Text>
          {action === "reject" && (
            <div style={{ marginTop: "1rem" }}>
              <Input
                name="rejectComment"
                placeholder={translation.enter_reason}
                value={rejectComment}
                onChange={(e) => setRejectComment(e)}
                error={error && error?.rejectComment}
              />
            </div>
          )}
          {needToBeVerified && (
            <div style={{ marginTop: "1rem" }}>
              <Input
                name="skipVerificationCode"
                placeholder={translation.enter_otp_code}
                value={skipVerificationCode}
                onChange={(e) => setCode(e)}
                error={error && error?.skipVerificationCode}
                maxLength={6}
                type="number"
                data-testid="skipVerificationCode"
                rightContent={
                  <Button
                    text={translation.resend}
                    appearance="subtle"
                    onClick={onResendCode}
                    loading={isResending}
                  />
                }
              />
              {canUseDiplomat && isPairValidator && (
                <div>
                  <br />

                  <List bordered className="mb-2">
                    <List.Item>
                      <Checkbox
                        label="Diplomat"
                        checked={isDiplomat}
                        onChange={() => setDiplomat(!isDiplomat)}
                        description={translation.diplomat_biometric_photo_only}
                      />
                    </List.Item>
                  </List>
                </div>
              )}
            </div>
          )}
        </div>
        <LibModal.Footer>
          <Stack>
            {selfieMandatory && (
              <Stack.Item>
                <Button
                  text={capitalizeText(translation.take_photo)}
                  onClick={() => setShowFacialAuth(true)}
                  appearance="ghost"
                />
              </Stack.Item>
            )}
            <Stack.Item grow={1}></Stack.Item>
            <Stack.Item>
              <Button
                text={capitalizeText(translation.cancel)}
                onClick={() => setConfirmModal(false)}
                appearance="default"
              />
              <Button
                text={
                  needToBeVerified
                    ? translation.verify_otp
                    : capitalizeText(translation.confirm)
                }
                onClick={() =>
                  action === "reject"
                    ? onReject(data._id)
                    : needToBeVerified
                      ? onVerify()
                      : action === "approve"
                        ? handleSendOTP()
                        : null
                }
                loading={submitting}
              />
            </Stack.Item>
          </Stack>
        </LibModal.Footer>
      </Modal>

      {/* //facial FacialAuth */}
      <Modal
        show={showFacialAuth}
        handleClose={() => setShowFacialAuth(false)}
        title={data.preEnrollmentNumber}
        size="xs"
      >
        <FacialAuth
          setOpen={setShowFacialAuth}
          prenrollmentId={data._id}
          preEnrollmentNo={data.preEnrollmentNumber}
          phoneNumber={data.phoneNumber}
          requestNumber={data.requestNo}
          photo={data.photo || ""}
          isStartedOnline={isStartedOnline}
        />
      </Modal>
    </>
  );
};

export default ViewInfo;
