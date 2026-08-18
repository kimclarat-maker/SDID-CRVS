import { useContext, useEffect, useState, CSSProperties } from "react";
import "@/libs/wacom-sdk/style/sigCaptDialog.css";
import {
  Panel,
  Stack,
  Text,
  Modal as LibModal,
  FlexboxGrid,
  ButtonToolbar,
} from "rsuite";
import Button from "@/components/button";
import { LanguageContext } from "@/context/LanguageContext";
import toastMessage from "@/utils/common/toastMessage";
import { onAddSignature } from "@/api/enrollments";
import Modal from "@/components/Modal";
import Enrollment from "../enrollmentStatus";
import Upload from "@/components/supportingDocuments/upload";
import { EnrollmentType } from "@/types/Enrollment";
import Comment from "@/components/comment";
import ViewComment from "@/components/comment/viewComment";
import { useParams } from "react-router-dom";
import axios from "axios";
import Empty from "@/components/empty";
import { signatureComments } from "@/constants/comments";
import { isUUID } from "@/utils/common/uuid";
import { useUploadBioData, useUploadMedia } from "@/hooks/useUploadMedia";
import PreviewSignature from "./preview";
import { cfg } from "@/constants/cfg";

interface Props {
  setTab: (t: string) => void;
  activeTab: string;
  enrollmentId: string;
  enableCapture: boolean;
  setOpen: (open: boolean) => void;
  isBioRefresh: boolean;
  bioRefreshToken?: string;
  age: number;
  enrollmentData: EnrollmentType;
  deviceSerialNumber?: string;
  who?: string;
  setUpdatedBioData: (data: any) => void;
  updatedBioData: any;
}

function Signature({
  enrollmentId,
  setTab,
  enableCapture,
  setOpen,
  isBioRefresh,
  bioRefreshToken,
  age,
  enrollmentData,
  deviceSerialNumber,
  who,
  setUpdatedBioData,
  updatedBioData,
}: Props) {
  const { translation } = useContext(LanguageContext);
  const [sigImg, setSigImg] = useState<string>();
  const [sigTxt, setSigTxt] = useState<string>();

  const [isSubmitting, setSubmitting] = useState<boolean>(false);
  const [openSuccessModal, setOpenSuccessModal] = useState<boolean>(false);
  const [showSDModal, setShowSDModal] = useState<boolean>(false);
  const [supportingDocuments, setSupportingDocuments] = useState<any[]>([]);
  const [isSubmittingWithSD, setSubmittingWithSD] = useState(false);
  const [comment, setComment] = useState<any>();
  const [updatedComment, setUpdatedComment] = useState("");
  const [openCommentModal, setOpenCommentModal] = useState(false);
  const { bioToken } = useParams();
  const { uploadBioData } = useUploadBioData();

  useEffect(() => {
    try {
      if (enrollmentData && enrollmentData?.biometric?.signature) {
        setSupportingDocuments(
          enrollmentData.biometric.signature.supportingDocuments
        );
      }

      if (enrollmentData && enrollmentData?.biometric?.signature?.signature) {
        setSigImg(enrollmentData?.biometric?.signature?.signature);
      }

      if (enrollmentData?.biometric?.signature?.comment) {
        setComment(enrollmentData?.biometric?.signature?.comment);
      }
    } catch (error) {
      console.error("Error parse preview:", error);
    }
  }, [enrollmentData, isBioRefresh]);

  const signatureMediaId = async () => {
    const headers = {
      "x-sdid-api-key": cfg.VITE_API_KEY,
      "x-sdid-api-secret-key": cfg.VITE_API_SECRET_KEY,
    };

    let signatureMediaId: any = sigImg;

    if (sigImg && !isUUID(sigImg)) {
      signatureMediaId = await uploadBioData({
        enableQualityChecker: false,
        base64Input: sigImg,
        referenceType: "ENROLLMENT_SIGNATURE",
        referenceId: enrollmentId,
        myHeaders: headers,
      });
    }

    return signatureMediaId;
  };

  const handleSubmit = async () => {
    try {
      if (!enableCapture && (!bioRefreshToken || bioRefreshToken === ""))
        return setOpen(false);

      if ((!sigImg || sigImg === "") && !comment) {
        return setOpenCommentModal(true);
      }

      setSubmitting(true);

      const mediaData = await signatureMediaId();

      const body = {
        enrollmentId,
        signature: mediaData?.data?._id || sigImg,
        bioRefreshToken,
        deviceSerialNumber,
        comment: comment?.label || comment,
        // preview: mediaData?.qualityCheckedData,
      };

      const { message } = await onAddSignature(body, isBioRefresh, bioToken);
      setSubmitting(false);
      toastMessage("success", message);
      handleUpdate({ status: "CAPTURED", ...body });

      setOpenSuccessModal(true);
      setShowSDModal(false);
    } catch (error: any) {
      setShowSDModal(false);
      setSubmitting(false);
      if (error?.response?.data?.message?.toUpperCase().includes("MISSING")) {
        setShowSDModal(true);
      } else {
        toastMessage(
          "error",
          error?.response?.data?.message || translation.submission_failed
        );
      }
    }
  };

  const handleSubmitWithSupportingDocument = async () => {
    try {
      setSubmittingWithSD(true);
      if (supportingDocuments.length === 0) return;

      const body = {
        enrollmentId,
        signature: await signatureMediaId(),
        supportingDocuments,
        bioRefreshToken,
        preview: sigTxt,
        deviceSerialNumber,
        comment: comment?.label || comment,
      };

      const { message } = await onAddSignature(body, isBioRefresh, bioToken);
      setSubmittingWithSD(false);
      setOpenSuccessModal(true);
      setShowSDModal(false);

      toastMessage("success", message);
      handleUpdate({ status: "CAPTURED", ...body });
    } catch (error: any) {
      setSubmittingWithSD(false);
      toastMessage(
        "error",
        error?.response?.data?.message || translation.submission_failed
      );
    }
  };

  const getSignatureFromApi = async () => {
    try {
      const options = {
        url: "https://localhost:11402/signature/capture",
        method: "POST",
        data: {
          who,
          why: "NIDA Single Digitial ID Enrollment",
        },
      };
      const response = await axios(options);
      console.log("signatureFromApi", response);
      getRenderSignature(response?.data?.sigText);
    } catch (error) {
      console.error("Failed to get signature from API: ", error);
      toastMessage("error", translation.failed_get_signature_from_api);
    }
  };

  const getRenderSignature = async (sigText: string) => {
    try {
      const options = {
        url: "https://localhost:11402/signature/render",
        method: "POST",
        data: {
          sigText,
          format: "PNG",
          relative: true,
          dpiX: 300,
          dpiY: 300,
          strokeWidth: 0.5,
          penColorRgb: 0,
          backgroundRgb: 16777215,
          marginLeft: 0,
          marginTop: 0,
          widthPx: 300,
          heightPx: 150,
        },
      };
      const response: any = await axios(options);

      setSigImg(`data:image/png;base64,${response?.data?.base64Image}`);
    } catch (error) {
      console.error("Failed to get signature from API: ", error);
      toastMessage("error", error);
    }
  };

  const onRetake = () => {
    setSupportingDocuments([]);
  };

  const styles = {
    imageContainer: {
      display: "flex",
      height: "50vh",
      alignItems: "center",
      justifyContent: "center",
    },
    sigImage: {
      width: "100%",
      height: "100%",
      objectFit: "contain",
    },
  };

  useEffect(() => {
    if (sigImg && sigImg !== "") {
      handleUpdate();
    }
  }, [sigImg, comment, supportingDocuments]);

  const handleUpdate = async (payload: any = {}) => {
    const body = {
      signature: {
        ...payload,
        signatureStatus: payload?.status,
      },
    };
    setUpdatedBioData &&
      setUpdatedBioData((prev: any) => ({
        ...prev,
        biometric: {
          ...prev.biometric,
          ...body,
        },
      }));
  };

  return (
    <>
      <ViewComment comment={comment} />

      <div className="row">
        {/* Supporting Documents */}
        <div>
          {supportingDocuments && supportingDocuments.length > 0 && (
            <Panel
              header={
                <Stack spacing={8}>
                  <Text className="text-primary">
                    {translation.supporting_documents}
                  </Text>
                </Stack>
              }
              shaded
              bordered
            >
              <Upload
                files={supportingDocuments}
                setFiles={setSupportingDocuments}
                referenceType="ENROLLMENT_SIGNATURE"
                referenceId={enrollmentId || ""}
                showUploadButton
                name="signature"
                enrollmentId={enrollmentId}
              />
            </Panel>
          )}
          <div style={styles.imageContainer}>
            {sigImg ? (
              <>
                {/* <img
                src={sigImg}
                alt="signature"
                style={styles.sigImage as CSSProperties}
              /> */}
                <PreviewSignature
                  image={sigImg}
                  styles={styles.sigImage as CSSProperties}
                />
              </>
            ) : (
              <Empty title={translation.no_signature_yet_start_capture} />
            )}
          </div>

          <br />
          {/* Action Buttons */}
          <Stack spacing={16}>
            <Stack.Item>
              <Button
                text={translation.go_back}
                onClick={() => setTab("fingerprint")}
                appearance="default"
              />
            </Stack.Item>
            <Stack.Item grow={1} />
            <Stack.Item>
              <ButtonToolbar>
                {enableCapture && (
                  <>
                    <Button
                      text={translation.comment}
                      startIcon="comment"
                      onClick={() => {
                        setOpenCommentModal(true);
                        setUpdatedComment(comment);
                      }}
                      appearance="default"
                    />
                    <Button
                      text={translation.start_capture}
                      onClick={getSignatureFromApi}
                    />
                  </>
                )}

                <Button
                  text={translation.next}
                  onClick={() => handleSubmit()}
                  loading={isSubmitting}
                  appearance="ghost"
                />
              </ButtonToolbar>
            </Stack.Item>
          </Stack>
        </div>
      </div>

      {/* Supporting Documents Modal */}
      <Modal
        show={showSDModal}
        handleClose={() => setShowSDModal(false)}
        title={translation.supporting_document_upload}
      >
        <Upload
          setFiles={setSupportingDocuments}
          files={supportingDocuments}
          referenceType="ENROLLMENT_SIGNATURE"
          referenceId={enrollmentId || ""}
          showUploadButton
          name="signature"
          enrollmentId={enrollmentId}
          biometricData={{
            signature: sigImg,
          }}
        />
        <br />
        <LibModal.Footer>
          <Button
            onClick={() => setShowSDModal(false)}
            text={translation.close}
            appearance="default"
          />
          <Button
            onClick={handleSubmitWithSupportingDocument}
            text={translation.next}
            loading={isSubmittingWithSD}
            // disabled={supportingDocuments?.length === 0}
          />
        </LibModal.Footer>
      </Modal>

      {/* Success Modal */}
      <Modal
        show={openSuccessModal}
        handleClose={() => setOpenSuccessModal(false)}
      >
        <Enrollment
          setTab={setTab}
          enrollmentId={enrollmentId}
          setOpen={setOpenSuccessModal}
          isBioRefresh={isBioRefresh}
          age={age}
          isPreview
          data={updatedBioData}
          setUpdatedBioData={setUpdatedBioData}
        />
      </Modal>

      {/* Comment Modal */}
      <Comment
        openCommentModal={openCommentModal}
        setOpenCommentModal={setOpenCommentModal}
        updatedComment={updatedComment}
        setUpdatedComment={setUpdatedComment}
        setComment={setComment}
        enableCapture={enableCapture}
        listComments={signatureComments(translation)}
      />
    </>
  );
}

export default Signature;
