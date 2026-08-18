import Button from "@/components/button";
import Empty from "@/components/empty";
import Loading from "@/components/loader";
import { LanguageContext } from "@/context/LanguageContext";
import { useFetchEnrollmentById } from "@/hooks/useFetchEnrollments";
import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
  useMemo
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ButtonToolbar,
  Heading,
  IconButton,
  Panel,
  PanelGroup,
  Stack,
  Text
} from "rsuite";
import PairValidation from "../pairValidation";
import FacialAuth from "@/components/facialAuth";
import { AccountType } from "@/types/Account";
import toastMessage from "@/utils/common/toastMessage";
import { onSubmitEnrollment } from "@/api/enrollments";
import CustomTabs from "@/components/tabs";
import PreviewSelfie from "../selfie/preview";
import PreviewIris from "../iris/preview";
import PreviewFingerprint from "../fingerprint/preview";
import Card from "@/components/card";
import Icon from "@/components/icon";
import Upload from "../../../../../../components/supportingDocuments/upload";
import PreviewSignature from "../signature/preview";

interface Props {
  enrollmentId: string;
  setOpen: (b: boolean) => void;
  page?: string;
  isBioRefresh?: boolean;
  setTab?: (tab: string) => void;
  age: number;
  isPreview?: boolean;
  data?: any;
  setUpdatedBioData?: (data: any | null) => void;
  isDiplomat?: boolean;
}

const Enrollment: React.FC<Props> = ({
  enrollmentId,
  setOpen,
  page,
  isBioRefresh,
  age,
  data,
  setUpdatedBioData,
  isDiplomat
}) => {
  const { translation } = useContext(LanguageContext);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isComplete, setIsComplete] = React.useState(false);
  const [childTab, setChildTab] = useState("photo");
  const [account, setSelectedAccount] = useState<AccountType>(
    {} as AccountType
  );
  const [isStartingPairValidation, setStartingPairValidation] = useState(false);

  const [isSubmitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const [stateData, setStateData] = useState<any>({});

  const [irisPreviewData, setIrisPreviewData] = useState<any>(null);

  const [searchParams] = useSearchParams();
  const isStartedOnline = searchParams.get("isStartedOnline") === "true";

  const {
    loading,
    fetchEnrollmentData,
    data: enrollmentData
  } = useFetchEnrollmentById();

  // ✅ Use stateData if it exists, otherwise use enrollmentData
  const currentData = useMemo(() => {
    return stateData && Object.keys(stateData).length > 0
      ? stateData
      : enrollmentData;
  }, [stateData, enrollmentData]);

  useEffect(() => {
    if (data && data.biometric) {
      return setStateData(data);
    }

    fetchEnrollmentData(enrollmentId, isStartedOnline);
  }, [enrollmentId, data]);

  const previewIris = useCallback(() => {
    if (currentData?.biometric?.iris?.preview) {
      try {
        const preview = JSON.parse(currentData?.biometric?.iris?.preview || "");
        setIrisPreviewData(preview);
      } catch (error) {
        console.error("Error parsing iris preview:", error);
        setIrisPreviewData(null);
      }
    }
  }, [currentData]);

  useEffect(() => {
    if (age < 5 || isDiplomat) return setIsComplete(true);

    if (
      age < 16 &&
      currentData?.biometric?.iris?.status === "CAPTURED" &&
      currentData?.biometric?.fingerprint?.status === "CAPTURED"
    ) {
      setIsComplete(true);
    } else if (
      currentData?.biometric?.iris?.status === "CAPTURED" &&
      currentData?.biometric?.fingerprint?.status === "CAPTURED"
    ) {
      setIsComplete(true);
    }

    previewIris();
  }, [currentData, age, previewIris]);

  const onSubmit = async (isMovingToPending?: boolean) => {
    try {
      setSubmitting(true);
      const data = await onSubmitEnrollment(
        enrollmentId,
        isBioRefresh,
        isStartedOnline
      );

      toastMessage("success", data.message);

      setSubmitting(false);

      setUpdatedBioData && setUpdatedBioData(null);

      if (isMovingToPending)
        return navigate("/dashboard/admin/request/pending");

      navigate(
        `/dashboard/admin/enrollment/${enrollmentId}?isStartedOnline=${isStartedOnline}`
      );
    } catch (error) {
      setSubmitting(false);
      toastMessage("error", error);
    }
  };

  const onStartPairValidation = async () => {
    try {
      setStartingPairValidation(true);
      const data = await onSubmitEnrollment(
        enrollmentId,
        isBioRefresh,
        isStartedOnline
      );
      toastMessage("success", data.message);
      setStartingPairValidation(false);

      setActiveIndex(1);
    } catch (error) {
      setStartingPairValidation(false);
      toastMessage("error", error);
    }
  };

  const displayFace = useCallback(() => {
    try {
      const face = currentData?.biometric?.face?.preview?.startsWith("{")
        ? JSON.parse(currentData?.biometric?.face?.preview || "")
        : currentData?.biometric?.face?.preview ||
          currentData?.biometric?.face?.face;

      return face?.photo || face;
    } catch (error) {
      console.error("Error displaying face:", error);
      return null;
    }
  }, [currentData]);

  // ✅ Memoize fingerprint data to prevent unnecessary re-renders
  const fingerprintData = useMemo(() => {
    if (!currentData?.biometric?.fingerprint) return {};

    return {
      LeftThumb: currentData.biometric.fingerprint.leftThumb || null,
      LeftIndex: currentData.biometric.fingerprint.leftIndex || null,
      LeftMiddle: currentData.biometric.fingerprint.leftMiddle || null,
      LeftRing: currentData.biometric.fingerprint.leftRing || null,
      LeftLittle: currentData.biometric.fingerprint.leftLittle || null,
      RightThumb: currentData.biometric.fingerprint.rightThumb || null,
      RightIndex: currentData.biometric.fingerprint.rightIndex || null,
      RightMiddle: currentData.biometric.fingerprint.rightMiddle || null,
      RightRing: currentData.biometric.fingerprint.rightRing || null,
      RightLittle: currentData.biometric.fingerprint.rightLittle || null,
      BothThumbs: currentData.biometric.fingerprint.thumbs || null,
      LeftFourFingers: currentData.biometric.fingerprint.leftFingers || null,
      RightFourFingers: currentData.biometric.fingerprint.rightFingers || null
    };
  }, [currentData?.biometric?.fingerprint]);

  if (loading) {
    return <Loading isFullScreen />;
  }

  if (!currentData) return <Empty title={translation.no_data_available} />;

  const renderPreviewBioCapturedData = () => {
    return (
      <CustomTabs
        activeTab={childTab}
        getTab={(t: string) => setChildTab(t)}
        options={[
          {
            title: translation.photo,
            key: "photo",
            data: (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: "1rem"
                }}
              >
                <PreviewSelfie
                  image={displayFace()}
                  styles={{ aspectRatio: "3/2", objectFit: "contain" }}
                />
                {currentData?.biometric?.selfie?.supportingDocuments?.length >
                  0 && (
                  <Upload
                    files={currentData?.biometric?.selfie?.supportingDocuments}
                    showDelete={false}
                  />
                )}
              </div>
            )
          },
          age >= 5 &&
            !isDiplomat && {
              title: translation.iris,
              key: "iris",
              data: (
                <>
                  <div className="rs-modal-body mb-2 mt-2">
                    <PreviewIris irisData={irisPreviewData} />
                  </div>
                  {currentData?.biometric?.iris?.supportingDocuments?.length >
                    0 && (
                    <Upload
                      files={currentData?.biometric?.iris?.supportingDocuments}
                      showDelete={false}
                    />
                  )}
                </>
              )
            },
          age >= 5 &&
            !isDiplomat && {
              title: translation.fingerprint,
              key: "fingerprint",
              data: (
                <div>
                  <PreviewFingerprint fingerData={fingerprintData} />
                  {currentData?.biometric?.fingerprint?.supportingDocuments
                    ?.length > 0 && (
                    <Upload
                      files={
                        currentData?.biometric?.fingerprint?.supportingDocuments
                      }
                      showDelete={false}
                    />
                  )}
                </div>
              )
            },
          age >= 16 &&
            !isDiplomat && {
              title: translation.signature,
              key: "signature",
              data: (
                <Card>
                  <PreviewSignature
                    image={currentData.biometric?.signature?.signature}
                  />
                  {currentData?.biometric?.signature?.supportingDocuments
                    ?.length > 0 && (
                    <Upload
                      files={
                        currentData?.biometric?.signature?.supportingDocuments
                      }
                      showDelete={false}
                    />
                  )}
                </Card>
              )
            }
        ].filter(Boolean)}
      />
    );
  };

  const renderLeftActions = () => {
    return (
      <ButtonToolbar>
        <Button
          text={translation.close}
          onClick={() => {
            setOpen(false);
          }}
          appearance="primary"
          color="red"
        />
        {age >= 5 && !isDiplomat && (
          <>
            <IconButton
              icon={<Icon name="chevron_left" />}
              onClick={() => {
                setChildTab(
                  childTab === "iris"
                    ? "photo"
                    : childTab === "fingerprint"
                      ? "iris"
                      : childTab === "signature"
                        ? "fingerprint"
                        : ""
                );
              }}
              appearance="default"
              disabled={childTab === "photo"}
            />
            <IconButton
              icon={<Icon name="chevron_right" />}
              text={translation.next}
              onClick={() => {
                setChildTab(
                  childTab === "photo"
                    ? "iris"
                    : childTab === "iris"
                      ? "fingerprint"
                      : childTab === "fingerprint"
                        ? "signature"
                        : "photo"
                );
              }}
              appearance="default"
              disabled={childTab === "signature"}
            />
          </>
        )}
      </ButtonToolbar>
    );
  };

  const renderRightActions = () => {
    return (
      <ButtonToolbar>
        <Button
          text={translation.pair_validation}
          onClick={onStartPairValidation}
          loading={isStartingPairValidation}
        />
        {page !== "pending" && (
          <Button
            text={translation.move_to_pending}
            appearance="ghost"
            onClick={() => onSubmit(true)}
            loading={isSubmitting}
          />
        )}
      </ButtonToolbar>
    );
  };

  return (
    <div className="rs-modal-body">
      {isComplete ? (
        <>
          <div>
            <Heading level={5} className="textPrimary textBold">
              {translation.enrollment_status}
            </Heading>
          </div>

          <PanelGroup>{renderPreviewBioCapturedData()}</PanelGroup>

          <Stack>
            <Stack.Item grow={1}>{renderLeftActions()}</Stack.Item>
            <Stack.Item>
              <ButtonToolbar>
                <Button
                  text={translation.submit}
                  onClick={() => onSubmit()}
                  disabled={!isComplete}
                  loading={isSubmitting}
                />
              </ButtonToolbar>
            </Stack.Item>
          </Stack>
        </>
      ) : (
        <>
          {activeIndex === 0 && (
            <div>
              <div>
                <PanelGroup bordered accordion>
                  {renderPreviewBioCapturedData()}
                </PanelGroup>
              </div>
              <br />
              <Stack>
                <Stack.Item grow={1}>{renderLeftActions()}</Stack.Item>
                <Stack.Item>{renderRightActions()}</Stack.Item>
              </Stack>
            </div>
          )}
          {activeIndex === 1 && (
            <>
              <PairValidation
                setActiveIndex={() => setActiveIndex(2)}
                setSelectedAccount={setSelectedAccount}
                isStartedOnline={isStartedOnline}
              />
              <br />
              <ButtonToolbar>
                <Button
                  text={translation.go_back}
                  onClick={() => setActiveIndex(0)}
                  appearance="default"
                />
              </ButtonToolbar>
            </>
          )}

          {activeIndex === 2 && (
            <>
              <div className="mb-2">
                <Heading level={5}>
                  <span className="textPrimary textBold">
                    {translation.face_validation}
                  </span>
                </Heading>
              </div>

              <FacialAuth
                setOpen={setOpen}
                setActiveIndex={setActiveIndex}
                enrollmentId={enrollmentId}
                accountId={account._id}
                email={account.email || ""}
                prevIndex={1}
                preEnrollmentNo={currentData?.preEnrollmentNumber}
                isBioRefresh={isBioRefresh}
                prenrollmentId={currentData.preEnrollmentId}
                isPairValidator
                photo={account.photo}
                isStartedOnline={isStartedOnline}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default React.memo(Enrollment);
