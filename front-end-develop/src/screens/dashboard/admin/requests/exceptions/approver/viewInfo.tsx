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
} from "rsuite";
import StackItem from "rsuite/esm/Stack/StackItem";
import moment from "moment";
import Empty from "@/components/empty";
import toastMessage from "@/utils/common/toastMessage";
import capitalizeText from "@/utils/common/capitalizeText";
import Input from "@/components/input";
import {
  convertCountryCodeToName,
  formateNationality,
} from "@/utils/common/countryNameFormat";
import Alert from "@/components/alert";
import {
  pairValidatorSkipSelfie,
  pairValidatorVerifySkipSelfieCode,
  skipSelfie,
  verifySkipSelfieCode,
} from "@/api/skipSelfie";
import { useNavigate } from "react-router-dom";
import { fetchEnrollments, onStart } from "@/api/enrollments";

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
}) => {
  const { translation } = useContext(LanguageContext);

  const [submitting, setSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [error, setError] = useState<any>({});
  const [skipVerificationCode, setCode] = useState("");
  const [isResending, setResending] = useState(false);
  const navigate = useNavigate();

  const renderItem = ({
    title,
    value,
    type,
  }: {
    title: string;
    value: string;
    type?: string;
  }) => {
    const itemStyles = {
      marginBottom: "0.5rem",
      backgroundColor: `var(--bg-color)`,
      padding: "1rem",
      borderRadius: 8,
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
        skipVerificationCode
      );

      toastMessage("success", data.message);

      await handleStartEnrollment();

      setSubmitting(false);
    } catch (error: any) {
      toastMessage("error", error);

      // if (
      //   error?.response?.data?.message?.includes(
      //     "OTP has already been verified"
      //   )
      // ) {
      //   await handleStartEnrollment();
      // }

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
        skipVerificationCode
      );

      toastMessage("success", data.message);

      navigate("/dashboard/admin/enrollment/" + enrollmentId);

      setSubmitting(false);
    } catch (error: any) {
      toastMessage("error", error);

      setSubmitting(false);
    }
  };

  const handleStartEnrollment = async () => {
    try {
      if (!preEnrollmentId) return;
      const startEnrollment = await onStart({
        preEnrollmentId: preEnrollmentId,
      });

      navigate(
        `/dashboard/admin/enrollment/biometrics/start/${startEnrollment.enrollmentId}`
      );
    } catch (error: any) {
      console.log("start enrollment error", error);

      if (error?.response?.data?.message?.includes("already exists")) {
        await getEnrollmentByPrenrollmentNo(data.preEnrollmentNumber);
      }
      setSubmitting(false);
    }
  };

  const getEnrollmentByPrenrollmentNo = async (preEnrollmentNo: string) => {
    const responseData: any = await fetchEnrollments({
      preEnrollmentNo,
    });

    if (responseData.data?.length === 0) return;

    navigate(
      `/dashboard/admin/enrollment/biometrics/start/${responseData.data[0]._id}`
    );
  };

  useEffect(() => {
    const onSubmit = async () => {
      if (skipVerificationCode?.length === 6) {
        if (isPairValidator) {
          await onVerifyPairValidator();

          return;
        } else {
          await onVerify();
        }
      }
    };
    onSubmit();
  }, [skipVerificationCode]);

  const handleResend = async () => {
    try {
      if (enrollmentId && accountId) {
        const data = await pairValidatorSkipSelfie(enrollmentId, true);
        toastMessage("success", data.message);

        setResending(false);
      }
    } catch (error) {
      toastMessage("error", error);

      setResending(false);
    }
  };

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
        <div style={{ overflowY: "auto", maxHeight: "50vh" }}>
          <Stack wrap spacing={8}>
            <StackItem style={{ marginBottom: "1rem" }}>
              {type === "account" ? (
                <Panel bordered header={translation.photo}>
                  <img src={data?.photo} height={180} />
                </Panel>
              ) : (
                <Panel bordered header={translation.selfie}>
                  <img src={data?.selfie} height={180} />
                </Panel>
              )}
            </StackItem>
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

          <div>
            {data.documentType &&
              renderItem({
                title: translation.document_type,
                value: data.documentType,
              })}
          </div>
          <div>
            {data.applicantCategory &&
              renderItem({
                title: translation.applicant_category,
                value: data.applicantCategory,
              })}
          </div>

          <div>
            {data.selfieVerificationSkipPhoneNumber &&
              renderItem({
                title: translation.phone_number,
                value: data.selfieVerificationSkipPhoneNumber,
              })}
          </div>
          <div>
            {data.identifier &&
              renderItem({
                title: translation.identifier,
                value: data.identifier,
              })}
          </div>

          <div>
            {renderItem({
              title: translation.date,
              value: data.createdAt,
              type: "date",
            })}
          </div>
          {data?.idNumber && (
            <>
              <div>
                {renderItem({
                  title: translation.id_number,
                  value: data.idNumber,
                })}
              </div>
            </>
          )}
          <>
            <div>
              {renderItem({
                title: translation.surname,
                value: data.firstName,
              })}
            </div>
            <div>
              {renderItem({
                title: translation.post_name,
                value: data.lastName,
              })}
            </div>
            <div>
              {renderItem({
                title: translation.gender,
                value: data.gender,
              })}
            </div>
            <div>
              {renderItem({
                title: translation.dob,
                value: data.dob,
              })}
            </div>
            <div>
              {renderItem({
                title: translation.placeOfBirth,
                value: convertCountryCodeToName(data.placeOfBirth),
              })}
            </div>
            <div>
              {renderItem({
                title: translation.country_of_birth,
                value: convertCountryCodeToName(data.countryOfBirth),
              })}
            </div>
            <div>
              {renderItem({
                title: translation.nationality,
                value: formateNationality(data.nationality),
              })}
            </div>
            <div>
              {renderItem({
                title: translation.address,
                value: data.address,
              })}
            </div>
            <div>
              {renderItem({
                title: translation.countryOfDomicile,
                value: formateNationality(data.countryOfDomicile),
              })}
            </div>
            <div>
              {renderItem({
                title: translation.province,
                value: data.province || "",
              })}
            </div>
            <div>
              {renderItem({
                title: translation.district,
                value: data.district || "",
              })}
            </div>
            <div>
              {renderItem({
                title: translation.sector,
                value: data.sector || "",
              })}
            </div>
            <div>
              {renderItem({
                title: translation.cell,
                value: data.cell || "",
              })}
            </div>
            <div>
              {renderItem({
                title: translation.village,
                value: data.village || "",
              })}
            </div>
            <div>
              {renderItem({
                title: translation.father_name,
                value: data.fatherNames || "",
              })}
            </div>

            <div>
              {renderItem({
                title: translation.mother_name,
                value: data.motherNames || "",
              })}
            </div>
            <div>
              {renderItem({
                title: translation.spouse,
                value: data.spouse || "",
              })}
            </div>
            <hr />
            <div>
              {data.digitalAmbassadorNid &&
                renderItem({
                  title: translation.done_by,
                  value: data.digitalAmbassadorNid || "",
                })}
            </div>
          </>
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
                {/* {data.selfieVerificationSkipStatus === "SKIP_SELFIE_PENDING" &&
                  data.status !== "VERIFIED" && (
                    <Button
                      text={capitalizeText(translation.visit_center)}
                      onClick={() => {
                        setOpen(false);
                        setVisitCenterModal(true);
                      }}
                      appearance="ghost"
                    />
                  )} */}
              </ButtonToolbar>
            </Stack.Item>
            <Stack.Item grow={1}></Stack.Item>
            {
              <>
                {true && (
                  <Stack.Item>
                    <Button
                      text={translation.verify}
                      onClick={() => {
                        setConfirmModal(true);
                        setOpen(false);
                      }}
                    />
                  </Stack.Item>
                )}
              </>
            }
          </Stack>
        </LibModal.Footer>
      </Modal>

      <Modal
        show={confirmModal}
        handleClose={() => setConfirmModal(false)}
        title={translation.enter_otp_code}
      >
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
                color={"var(--rs-primary)"}
                onClick={handleResend}
                loading={isResending}
              />
            }
          />
        </div>
        <br />
        <LibModal.Footer>
          <Button
            text={capitalizeText(translation.cancel)}
            onClick={() => setConfirmModal(false)}
            appearance="default"
          />
          <Button
            text={translation.submit}
            onClick={() => onVerify()}
            loading={submitting}
          />
        </LibModal.Footer>
      </Modal>
    </>
  );
};

export default ViewInfo;
