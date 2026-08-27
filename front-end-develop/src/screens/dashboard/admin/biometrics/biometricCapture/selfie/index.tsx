import Button from "@/components/button";
import { LanguageContext } from "@/context/LanguageContext";
import React, { useContext, useEffect, useState } from "react";
import { ButtonToolbar, Stack, Tag } from "rsuite";
import { onAddSelfie } from "@/api/enrollments";
import toastMessage from "@/utils/common/toastMessage";
import Modal from "@/components/Modal";
import PreviewSelfie from "./preview";
import Enrollment from "../enrollmentStatus";
import { EnrollmentType } from "@/types/Enrollment";
import Comment from "@/components/comment";
import ViewComment from "@/components/comment/viewComment";
import { useSelfie } from "@/context/SelfieContext";
import EnrollFromCameraTab from "@/screens/cameraTest";
import { useParams, useSearchParams } from "react-router-dom";
import { selfieComments } from "@/constants/comments";
import { useUploadBioData } from "@/hooks/useUploadMedia";
import { isUUID } from "@/utils/common/uuid";
import { cfg } from "@/constants/cfg";
import { isDemoMode } from "@/demo/config";
import { DEMO_PLACEHOLDER_IMAGE } from "@/demo/services/enrollmentBiometrics";

interface Props {
  setTab: (tab: string) => void;
  nextTab: string;
  enrollmentId: string;
  enableCapture: boolean;
  isBioRefresh: boolean;
  bioRefreshToken?: string;
  enrollmentData: EnrollmentType;
  age: number;
  deviceSerialNumber?: string;
  activeTab?: string;
  setUpdatedBioData: (data: any) => void;
  updatedBioData: {
    face: any;
    iris: any;
    fingerprint: any;
    signature: any;
  };
  isDiplomat?: boolean;
}

const Selfie: React.FC<Props> = ({
  setTab,
  nextTab,
  enrollmentId,
  enableCapture,
  isBioRefresh,
  bioRefreshToken,
  enrollmentData,
  age,
  deviceSerialNumber,
  setUpdatedBioData,
  updatedBioData,
  isDiplomat
}) => {
  const { translation } = useContext(LanguageContext);
  const [isSubmitting, setSubmitting] = useState(false);
  const [supportingDocuments, setSupportingDocuments] = useState<string[]>([]);
  const [showSDModal, setShowSDModal] = useState(false);
  const [comment, setComment] = useState<any>();
  const [openSuccessModal, setOpenSuccessModal] = useState(false);
  const [updatedComment, setUpdatedComment] = useState<any>();
  const [openCommentModal, setOpenCommentModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const { bioToken } = useParams();
  const { uploadBioData } = useUploadBioData();
  const [originalPreview, setOriginalPrevew] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const isStartedOnline = searchParams.get("isStartedOnline") === "true";

  // Use the custom hook
  const {
    selfieImage,
    setSelfieImage,
    originalImage,
    setOriginalImage,
    icaoAttributes
  } = useSelfie();

  useEffect(() => {
    const getInfo = async () => {
      try {
        if (enrollmentData) {
          let { face, preview, supportingDocuments, comment } =
            enrollmentData?.biometric?.face || {};

          let formatPreview = preview?.startsWith("{")
            ? JSON.parse(preview || {})
            : preview;

          setComment(comment);

          setSupportingDocuments(supportingDocuments);

          setOriginalImage(face);

          if (formatPreview) {
            setOriginalPrevew(formatPreview);
          }

          setSelfieImage(formatPreview?.photo || formatPreview);
        } else {
          setSelfieImage(null);
        }
      } catch (error) {
        console.error("Error parse preview:", error);
        toastMessage("error", error);
      }
    };
    getInfo();
  }, [enrollmentData]);

  // Demo mode has no real webcam, and this screen's "Next"/"Submit" button
  // is gated on selfieImage being set — auto-fill a placeholder photo so the
  // wizard can still be clicked through end-to-end (spec: auto-simulate
  // capture steps with dummy data).
  useEffect(() => {
    if (isDemoMode() && !selfieImage) {
      setSelfieImage(DEMO_PLACEHOLDER_IMAGE);
      setOriginalImage(DEMO_PLACEHOLDER_IMAGE);
    }
  }, [selfieImage]);

  const onReset = () => {
    // setSelfieImage(null);
    setShowCamera(true);
  };

  const handleSubmit = async (supportingDocuments?: any) => {
    try {
      if (!enableCapture && (!bioRefreshToken || bioRefreshToken === ""))
        return setTab(nextTab);

      if (!selfieImage && supportingDocuments?.length === 0)
        return toastMessage(
          "error",
          "Please provide supporting documents or capture a selfie"
        );

      if (!deviceSerialNumber)
        return toastMessage(
          "error",
          `Serial number not found, make sure you have camera assigned to you and it's connected to your laptop`
        );

      setSubmitting(true);

      let originalImageMediaId: any = originalImage;
      let selfieImageMediaId: any = selfieImage;
      let isLiveFace = false;

      const headers = {
        "x-sdid-api-key": cfg.VITE_API_KEY,
        "x-sdid-api-secret-key": cfg.VITE_API_SECRET_KEY
      };

      if (selfieImage && !isUUID(selfieImage)) {
        selfieImageMediaId = await uploadBioData({
          base64Input: selfieImage,
          referenceType: "ENROLLMENT_FACE",
          referenceId: enrollmentId,
          myHeaders: headers,
          enableQualityChecker: false,
          isStartedOnline
        });
      }

      if (originalImage && !isUUID(originalImage)) {
        originalImageMediaId = await uploadBioData({
          base64Input: originalImage,
          referenceType: "ENROLLMENT_FACE",
          referenceId: enrollmentId,
          myHeaders: headers,
          enableQualityChecker: true,
          isStartedOnline
        });
        isLiveFace = true;
      }

      let previewData: any = {
        photo: selfieImageMediaId?.data?._id || selfieImageMediaId,
        icaoAttributes
      };

      if (!icaoAttributes && originalPreview.icaoAttributes) {
        previewData.icaoAttributes = originalPreview.icaoAttributes;
      }

      if (selfieImageMediaId?.qualityCheckedData?.bBox) {
        previewData.bBox = selfieImageMediaId?.qualityCheckedData?.bBox;
      } else if (originalPreview && originalPreview?.bBox) {
        previewData["bBox"] = originalPreview?.bBox;
      }

      if (selfieImageMediaId?.qualityCheckedData?.quality) {
        previewData.quality = selfieImageMediaId?.qualityCheckedData?.quality;
      } else if (originalPreview && originalPreview?.quality) {
        previewData["quality"] = originalPreview?.quality;
      }

      const body = {
        enrollmentId,
        face: originalImageMediaId?.data?._id || originalImageMediaId,
        preview: JSON.stringify(previewData),
        supportingDocuments: supportingDocuments?.map(
          (item: any) => item._id || item
        ),
        bioRefreshToken,
        deviceSerialNumber,
        comment: comment?.label || comment
      };

      const { message } = await onAddSelfie(
        body,
        isBioRefresh,
        bioToken,
        isStartedOnline
      );
      setSubmitting(false);
      toastMessage("success", message);
      handleUpdate({ status: "CAPTURED", ...body });

      if (age < 5 || isDiplomat) {
        return setOpenSuccessModal(true);
      }
      setTab(nextTab);
    } catch (error: any) {
      toastMessage("error", error);
      setSubmitting(false);

      if (error?.response?.data?.message?.toUpperCase().includes("MISSING")) {
        setShowSDModal(true);
      }
    }
  };

  useEffect(() => {
    const getInfo = async () => {
      if (selfieImage && selfieImage !== "") {
        handleUpdate({});
      }
    };

    getInfo();
  }, [selfieImage]);

  const handleUpdate = ({
    status,
    face,
    preview
  }: {
    status?: string;
    face?: string;
    preview?: string;
  }) => {
    const body = {
      face: {
        face,
        preview,
        supportingDocuments,
        comment,
        faceStatus: status
      }
    };

    setUpdatedBioData &&
      setUpdatedBioData((prev: any) => ({
        ...prev,
        biometric: {
          ...prev.biometric,
          ...body
        }
      }));
  };

  return (
    <div>
      <ViewComment
        comment={comment}
        enableClearComment
        setComment={setComment}
      />

      <div>
        {selfieImage ? (
          <center>
            <PreviewSelfie image={selfieImage} styles={{ width: 360 }} />
          </center>
        ) : (
          <Stack spacing={16} justifyContent="center" alignItems="center">
            <Stack.Item>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  alignItems: "center",
                  textAlign: "center",
                  height: "65vh"
                }}
              >
                <Tag
                  color="blue"
                  style={{ backgroundColor: "var(--color-primary-500)" }}
                >
                  {translation.sn}: <b>{deviceSerialNumber}</b>
                </Tag>

                <div
                  style={{
                    width: "413px",
                    height: "531px",
                    border: "2px dashed var(--border)",
                    borderRadius: "1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "var(--rs-gray-500)"
                  }}
                >
                  <div style={{ color: "var(--border)", textAlign: "center" }}>
                    <p>
                      <strong>
                        {translation.no_selfie_available_for_submission}
                      </strong>
                    </p>
                    <p>
                      {enableCapture
                        ? translation.click_capture_selfie
                        : translation.supporting_document_required}
                    </p>
                  </div>
                </div>
              </div>
            </Stack.Item>
          </Stack>
        )}
      </div>

      <br />

      <Stack>
        <Stack.Item grow={1}></Stack.Item>

        <Stack.Item>
          <ButtonToolbar>
            {enableCapture && (
              <Button
                text={translation.comment}
                onClick={() => {
                  setOpenCommentModal(true);
                  setUpdatedComment(comment);
                }}
                testId="comment"
                startIcon={comment !== "" ? "visibility" : "add"}
                appearance="default"
              />
            )}

            {enableCapture && selfieImage && (
              <Button
                startIcon="refresh"
                text={translation.retake}
                onClick={onReset}
                appearance="default"
              />
            )}

            {enableCapture && !selfieImage && (
              <Button
                text={translation.start_capture}
                onClick={() => {
                  setShowCamera(true);
                }}
                appearance="primary"
              />
            )}
            <Button
              text={
                age < 5 || isDiplomat ? translation.submit : translation.next
              }
              onClick={() => {
                handleSubmit(supportingDocuments);
              }}
              testId="next"
              loading={isSubmitting}
              disabled={
                !selfieImage &&
                (!supportingDocuments || supportingDocuments?.length === 0)
              }
            />
          </ButtonToolbar>
        </Stack.Item>
      </Stack>

      <Modal
        show={openSuccessModal}
        handleClose={() => setOpenSuccessModal(false)}
        title=""
      >
        <Enrollment
          setTab={setTab}
          enrollmentId={enrollmentId}
          setOpen={setOpenSuccessModal}
          isBioRefresh={isBioRefresh}
          age={age}
          data={updatedBioData}
          isDiplomat={isDiplomat}
        />
      </Modal>

      <Comment
        openCommentModal={openCommentModal}
        setOpenCommentModal={setOpenCommentModal}
        updatedComment={updatedComment}
        setUpdatedComment={setUpdatedComment}
        setComment={setComment}
        enableCapture={enableCapture}
        listComments={selfieComments(translation)}
      />

      <Modal
        show={showCamera}
        handleClose={() => setShowCamera(false)}
        size="lg"
      >
        <div className="rs-modal-body">
          <EnrollFromCameraTab />
        </div>
      </Modal>
    </div>
  );
};

export default Selfie;
