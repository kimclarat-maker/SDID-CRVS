import Alert from "@/components/alert";
import Button from "@/components/button";
import { LanguageContext } from "@/context/LanguageContext";
import { useEffect, useState, useRef, useContext } from "react";
import {
  ButtonToolbar,
  Panel,
  PanelGroup,
  Text,
  Modal as LibModal,
  Stack,
  IconButton,
  Tag,
  TagGroup,
} from "rsuite";
import toastMessage from "@/utils/common/toastMessage";
import { onAddFingerprint } from "@/api/enrollments";
import Modal from "@/components/Modal";
import Upload from "@/components/supportingDocuments/upload";
import Empty from "@/components/empty";
import PreviewFingerprint from "./preview";
import Icon from "@/components/icon";
import Enrollment from "../enrollmentStatus";
import { EnrollmentType } from "@/types/Enrollment";
import Comment from "@/components/comment";
import ViewComment from "@/components/comment/viewComment";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { fingerprintComments } from "@/constants/comments";
import { useUploadBioData } from "@/hooks/useUploadMedia";
import { isUUID } from "@/utils/common/uuid";
import { isDemoMode } from "@/demo/config";
import { cfg } from "@/constants/cfg";
import capitalizeText from "@/utils/common/capitalizeText";
import { preview } from "vite";
import Loading from "@/components/loader";

interface StatusMessage {
  text: string;
  type: "info" | "success" | "error";
}

declare global {
  interface Window {
    BioCore: any;
  }
}

function getDefaultWorkflowXml() {
  return `<Workflow>
  <Name>Left To Right; 442; Wsq</Name>
  <Step>
    <UseAutoCapture>true</UseAutoCapture>
    <UseAutoContrast>true</UseAutoContrast>
    <ImageCompressionSettings>
      <ImageCompressionMethod>WSQ</ImageCompressionMethod>
      <ImageCompressionRatio>8</ImageCompressionRatio>
    </ImageCompressionSettings>
    <Fingerprint>
      <Position>LeftFourFingers</Position>
      <Impression>LivescanPlain</Impression>
       <MinReqQuality>10</MinReqQuality>
    </Fingerprint>
  </Step>
  <Step>
    <UseAutoCapture>true</UseAutoCapture>
    <UseAutoContrast>true</UseAutoContrast>
    <ImageCompressionSettings>
      <ImageCompressionMethod>WSQ</ImageCompressionMethod>
      <ImageCompressionRatio>8</ImageCompressionRatio>
    </ImageCompressionSettings>
    <Fingerprint>
      <Position>RightFourFingers</Position>
      <Impression>LivescanPlain</Impression>
       <MinReqQuality>10</MinReqQuality>
    </Fingerprint>
  </Step>
  <Step>
    <UseAutoCapture>true</UseAutoCapture>
    <UseAutoContrast>true</UseAutoContrast>
    <ImageCompressionSettings>
      <ImageCompressionMethod>WSQ</ImageCompressionMethod>
      <ImageCompressionRatio>8</ImageCompressionRatio>
    </ImageCompressionSettings>
    <Fingerprint>
      <Position>BothThumbs</Position>
      <Impression>LivescanPlain</Impression>
       <MinReqQuality>10</MinReqQuality>
    </Fingerprint>
  </Step>
</Workflow>
`;
}

export function useBioCore() {
  const [bioCore, setBioCore] = useState<any>(null);
  const [status, setStatus] = useState<{ text: string; type: string } | null>(
    null
  );

  useEffect(() => {
    const serviceUrl = `https://localhost:7743`;
    // Check if already loaded
    if (window.BioCore) {
      setBioCore(window.BioCore);
      return;
    }

    const script = document.createElement("script");
    script.src = "/BioCore.final.js";
    script.async = true;

    script.onload = () => {
      console.log("BioCore script loaded");
      if (window.BioCore && serviceUrl) {
        window.BioCore.init(window.BioCore.RESTFUL_XML, serviceUrl);
        window.BioCore.status(
          2000,
          () =>
            setStatus({ text: "Connected to BioCore service.", type: "info" }),
          () =>
            setStatus({ text: "BioCore service not reachable.", type: "error" })
        );
        setBioCore(window.BioCore);
      }
    };

    script.onerror = () => {
      setStatus({ text: "Failed to load BioCore.", type: "error" });
    };

    document.body.appendChild(script);

    return () => {
      console.log("Cleanup BioCore script");

      // if (window.BioCore) {
      //   window.BioCore.reset(() => {});
      //   window.BioCore = null;
      //   setBioCore(null);

      //   const bioO = document.getElementById("BioCore-Overlay-L0");

      //   if (bioO) {
      //     document.body.removeChild(bioO);
      //   }
      // }

      document.body.removeChild(script);
    };
  }, []);

  return { bioCore, status };
}

const FingerprintCapturePage = ({
  setTab,
  enrollmentId,
  nextTab,
  enableCapture,
  bioRefreshToken,
  isBioRefresh,
  activeTab,
  age,
  enrollmentData,
  deviceSerialNumber,
  updatedBioData,
  setUpdatedBioData,
  fetchDevice,
  loadingDevice,
}: {
  setTab: (tab: string) => void;
  enrollmentId: string;
  nextTab: string;
  enableCapture: boolean;
  activeTab?: string;
  isBioRefresh: boolean;
  bioRefreshToken?: string;
  age: number;
  enrollmentData: EnrollmentType;
  deviceSerialNumber?: string;
  updatedBioData: any;
  setUpdatedBioData: (data: any) => void;
  fetchDevice?: () => void;
  loadingDevice?: boolean;
}) => {
  const [isStarting, setStarting] = useState(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [fingerData, setFingerData] = useState<
    Record<string, { imgSrc?: string; quality?: number; base64?: string }>
  >({});
  const [workflowXml, setWorkflowXml] = useState(getDefaultWorkflowXml());
  const lastResultRef = useRef<any>(null);
  const { bioCore: BioCore, status: bioCoreStatus } = useBioCore();
  const { translation } = useContext(LanguageContext);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isSubmittingWithSD, setSubmittingWithSD] = useState(false);
  const [showSDModal, setShowSDModal] = useState(false);
  const [supportingDocuments, setSupportingDocuments] = useState([]);
  const [bckFormatData, setBCKFormatData] = useState({});
  const [openSuccessModal, setOpenSuccessModal] = useState(false);
  const [comment, setComment] = useState<any>();
  const [updatedComment, setUpdatedComment] = useState<any>();
  const [openCommentModal, setOpenCommentModal] = useState(false);
  const { bioToken } = useParams();

  const [searchParams] = useSearchParams();
  const isStartedOnline = searchParams.get("isStartedOnline") === "true";

  const { uploadBioData } = useUploadBioData();

  useEffect(() => {
    try {
      if (enrollmentData && enrollmentData?.biometric?.fingerprint) {
        setSupportingDocuments(
          enrollmentData.biometric.fingerprint.supportingDocuments
        );

        const savedFP = {
          LeftThumb: enrollmentData.biometric.fingerprint?.leftThumb || null,
          LeftIndex: enrollmentData.biometric.fingerprint?.leftIndex || null,
          LeftMiddle: enrollmentData.biometric.fingerprint?.leftMiddle || null,
          LeftRing: enrollmentData.biometric.fingerprint?.leftRing || null,
          LeftLittle: enrollmentData.biometric.fingerprint?.leftLittle || null,
          RightThumb: enrollmentData.biometric.fingerprint?.rightThumb || null,
          RightIndex: enrollmentData.biometric.fingerprint?.rightIndex || null,
          RightMiddle:
            enrollmentData.biometric.fingerprint?.rightMiddle || null,
          RightRing: enrollmentData.biometric.fingerprint?.rightRing || null,
          RightLittle:
            enrollmentData.biometric.fingerprint?.rightLittle || null,
          BothThumbs: enrollmentData.biometric.fingerprint?.thumbs || null,
          LeftFourFingers:
            enrollmentData.biometric.fingerprint?.leftFingers || null,
          RightFourFingers:
            enrollmentData.biometric.fingerprint?.rightFingers || null,
          preview:
            enrollmentData.biometric.fingerprint?.preview &&
            enrollmentData.biometric.fingerprint?.preview !== ""
              ? JSON.parse(enrollmentData.biometric.fingerprint?.preview)
              : null,
        };

        setFingerData(savedFP);
      }

      if (enrollmentData?.biometric?.fingerprint?.comment) {
        setComment(enrollmentData?.biometric?.fingerprint?.comment);
      }
    } catch (error) {
      console.error("Error parse preview:", error);
    }
  }, [enrollmentData]);

  // Demo mode has no real fingerprint scanner to produce a capture, and this
  // screen's "Next" button is gated on supportingDocuments being non-empty
  // (not on an actual scan) — auto-attach a placeholder document so the
  // wizard can still be clicked through end-to-end (spec: auto-simulate
  // capture steps with dummy data).
  useEffect(() => {
    if (isDemoMode() && (!supportingDocuments || supportingDocuments.length === 0)) {
      setSupportingDocuments([
        { _id: "demo-fingerprint-doc", name: "Demo supporting document.pdf" },
      ] as any);
    }
  }, [supportingDocuments]);

  const lowQualityFingersRef = useRef<any[]>([]); // keeps low quality separately

  const processFingerprintResult = (fp: any) => {
    if (!fp || !fp.Position) return;

    lastResultRef.current = fp;
    const position: string = fp.Position;
    const quality = fp.Image?.Quality?.NativeScore ?? null;

    // 👉 check quality < 10
    if (quality !== null && quality < 10) {
      lowQualityFingersRef.current.push({
        position,
        quality,
        reason: fp.Annotation?.Reason || null,
      });
    }

    // Only process if there's actual image data
    if (fp.Image && fp.Image.ImageUri) {
      BioCore.getImage(fp, async (imageDataUrl: string) => {
        const base64Image = await convertImageToBase64(imageDataUrl);

        setFingerData((prev) => ({
          ...prev,
          [position]: {
            imgSrc: imageDataUrl,
            quality: quality ?? "N/A",
            base64: base64Image,
          },
        }));
      });
    } else {
      console.log(`Finger ${position} is missing: ${fp.Annotation?.Reason}`);
    }

    // Process children recursively
    if (fp.Children?.Child) {
      const children = Array.isArray(fp.Children.Child)
        ? fp.Children.Child
        : [fp.Children.Child];
      children.forEach((child: any) => processFingerprintResult(child));
    }
  };

  const startCapture = () => {
    if (!BioCore) return;
    setFingerData({});
    setBCKFormatData({});
    setSupportingDocuments([]);
    lowQualityFingersRef.current = []; // reset before capture

    BioCore.reset(() => {
      BioCore.startCapture(workflowXml, (result: any) => {
        if (!result?.FingerprintBiometrics) {
          setStatus({
            text: "Capture failed or was cancelled.",
            type: "error",
          });
          return;
        }

        console.log("Capture complete.");
        setStarting(false);

        const biometrics = result.FingerprintBiometrics.FingerprintBiometric;
        const fps = Array.isArray(biometrics) ? biometrics : [biometrics];
        fps.forEach(processFingerprintResult);

        // 👉 after processing you can access all low-quality fingerprints
        console.log(
          "Low quality fingerprints (<10):",
          lowQualityFingersRef.current
        );
      });
    });
  };

  const cancelCapture = () => {
    console.log("cancel fingerprint");
    if (!BioCore) return;
    setStatus(null);
    setFingerData({});
    setStatus(null);
    BioCore.reset(() => {});
  };

  // Helper function to convert image URL to base64
  const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to convert blob to base64"));
        }
      };
      reader.onerror = () => reject(new Error("FileReader error"));
      reader.readAsDataURL(blob);
    });
  };

  const getPreviewForBody = () => {
    if (fingerData?.preview) return fingerData?.preview;

    const data = Object.keys(fingerData).map((key) => {
      return {
        position: key,
        quality: fingerData[key]?.quality || "N/A",
      };
    });

    return data.length > 0 ? data : null;
  };
  const returnBody = () => {
    const body: any = {
      leftThumb: fingerData.LeftThumb?.base64 || fingerData.LeftThumb || null,
      // leftThumbScore: fingerData.LeftThumb?.quality
      //   ? Number(fingerData.LeftThumb.quality)
      //   : null,
      leftIndex: fingerData.LeftIndex?.base64 || fingerData.LeftIndex || null,
      // leftIndexScore: fingerData.LeftIndex?.quality
      //   ? Number(fingerData.LeftIndex.quality)
      //   : null,
      leftMiddle:
        fingerData.LeftMiddle?.base64 || fingerData.LeftMiddle || null,
      // leftMiddleScore: fingerData.LeftMiddle?.quality
      //   ? Number(fingerData.LeftMiddle.quality)
      //   : null,
      leftRing: fingerData.LeftRing?.base64 || fingerData.LeftRing || null,
      // leftRingScore: fingerData.LeftRing?.quality
      //   ? Number(fingerData.LeftRing.quality)
      //   : null,
      leftLittle:
        fingerData.LeftLittle?.base64 || fingerData.LeftLittle || null,
      // leftLittleScore: fingerData.LeftLittle?.quality
      //   ? Number(fingerData.LeftLittle.quality)
      //   : null,
      rightThumb:
        fingerData.RightThumb?.base64 || fingerData.RightThumb || null,
      // rightThumbScore: fingerData.RightThumb?.quality
      //   ? Number(fingerData.RightThumb.quality)
      //   : null,
      rightIndex:
        fingerData.RightIndex?.base64 || fingerData.RightIndex || null,
      // rightIndexScore: fingerData.RightIndex?.quality
      //   ? Number(fingerData.RightIndex.quality)
      //   : null,
      rightMiddle:
        fingerData.RightMiddle?.base64 || fingerData.RightMiddle || null,
      // rightMiddleScore: fingerData.RightMiddle?.quality
      //   ? Number(fingerData.RightMiddle.quality)
      //   : null,
      rightRing: fingerData.RightRing?.base64 || fingerData.RightRing || null,
      // rightRingScore: fingerData.RightRing?.quality
      //   ? Number(fingerData.RightRing.quality)
      //   : null,
      rightLittle:
        fingerData.RightLittle?.base64 || fingerData.RightLittle || null,
      // rightLittleScore: fingerData.RightLittle?.quality
      //   ? Number(fingerData.RightLittle.quality)
      //   : null,
      thumbs: fingerData.BothThumbs?.base64 || fingerData.BothThumbs || null,
      leftFingers:
        fingerData.LeftFourFingers?.base64 ||
        fingerData.LeftFourFingers ||
        null,
      rightFingers:
        fingerData.RightFourFingers?.base64 ||
        fingerData.RightFourFingers ||
        null,
      supportingDocuments,
      bioRefreshToken,
      deviceSerialNumber,
      comment: comment?.label || comment,
      preview: getPreviewForBody(),
    };

    return body;
  };

  const processBodyFingerprints = async () => {
    const body: any = await returnBody();

    const headers = {
      "x-sdid-api-key": cfg.VITE_API_KEY,
      "x-sdid-api-secret-key": cfg.VITE_API_SECRET_KEY,
    };

    const fingerprintConfig = [
      { key: "unknown", name: "Unknown" },
      { key: "rightThumb", name: "RightThumb" },
      { key: "rightIndex", name: "RightIndexFinger" },
      { key: "rightMiddle", name: "RightMiddleFinger" },
      { key: "rightRing", name: "RightRingFinger" },
      { key: "rightLittle", name: "RightLittleFinger" },
      { key: "leftThumb", name: "LeftThumb" },
      { key: "leftIndex", name: "LeftIndexFinger" },
      { key: "leftMiddle", name: "LeftMiddleFinger" },
      { key: "leftRing", name: "LeftRingFinger" },
      { key: "leftLittle", name: "LeftLittleFinger" },
      { key: "thumbs", name: "PlainThumbs" },
      { key: "leftFingers", name: "PlainLeftFourFingers" },
      { key: "rightFingers", name: "PlainRightFourFingers" },
    ];

    let previewData: any = body.preview || {};

    if (typeof body.preview === "string") {
      previewData = JSON.parse(body.preview);
    }

    // Create a copy to avoid reference issues
    const updatedPreviewData = { ...previewData };

    for (const field of fingerprintConfig) {
      if (body[field.key] && !isUUID(body[field.key])) {
        try {
          const uploadType = `ENROLLMENT_FINGERPRINT`;
          const res = await uploadBioData({
            enableQualityChecker: false,
            // ![
            //   "leftFingers",
            //   "rightFingers",
            //   "thumbs",
            // ].includes(field.key),

            base64Input: body[field.key],
            referenceType: uploadType,
            referenceId: enrollmentId,
            myHeaders: headers,
            position: field.name,
          });
          const id = res?.data?._id || res;
          body[field.key] = id || res;

          // ✅ FIX: Direct assignment to the updated object
          updatedPreviewData[field.key] = res.qualityCheckedData;
        } catch (error) {
          console.log(error);
        }
      }
    }

    return {
      ...body,
      preview: JSON.stringify(updatedPreviewData),
    };
  };

  const getBioCaptureStatus = (body: any) => {
    const mandatoryBioData = [
      "leftIndex",
      "rightIndex",
      "leftThumb",
      "rightThumb",
      "leftMiddle",
      "rightMiddle",
      "leftRing",
      "rightRing",
      "leftLittle",
      "rightLittle",
      "leftFingers",
      "rightFingers",
      "thumbs",
    ];

    let status = "CAPTURED";
    Object.keys(body).forEach((key) => {
      if (mandatoryBioData.includes(key) && !body[key]) {
        status = "CAPTURED_WITH_SUPPORTING_DOCUMENT";
      }
    });

    return status;
  };

  const onNext = async () => {
    try {
      if (!enableCapture && (!bioRefreshToken || bioRefreshToken === ""))
        return setTab(nextTab);
      if (!enrollmentId) return toastMessage("error", "MISSING enrollmentId");

      setSubmitting(true);

      const body: any = await processBodyFingerprints();

      setBCKFormatData(body);

      const data = await onAddFingerprint(
        enrollmentId,
        body,
        isBioRefresh,
        bioToken,
        isStartedOnline
      );

      const status = getBioCaptureStatus(body);

      toastMessage("success", data.message);
      handleUpdate({ status, ...body });

      setSubmitting(false);
      setShowSDModal(false);
      BioCore.reset(() => {});

      if (age < 16) return setOpenSuccessModal(true);

      setTab(nextTab);
    } catch (error: any) {
      setSubmitting(false);

      if (error?.response?.data?.message?.toUpperCase().includes("MISSING")) {
        return setShowSDModal(true);
      }

      setBCKFormatData({});
      toastMessage("error", error);
    }
  };

  const handleSubmmitWithSD = async () => {
    try {
      setSubmittingWithSD(true);
      const body: any = await processBodyFingerprints();

      setBCKFormatData(body);

      const data = await onAddFingerprint(
        enrollmentId,
        body,
        isBioRefresh,
        bioToken,
        isStartedOnline
      );

      const status = getBioCaptureStatus(body);

      toastMessage(
        "success",
        typeof data?.message === "string"
          ? data?.message
          : typeof data?.message === "object" && data?.message?.length > 0
          ? data?.message?.join(", ")
          : data?.message
      );
      handleUpdate({ status, ...body });

      setTab(nextTab);
      setSubmittingWithSD(false);

      if (age < 16) return setOpenSuccessModal(true);

      setShowSDModal(false);
    } catch (error: any) {
      setSubmitting(false);
      setBCKFormatData({});
      setSubmittingWithSD(false);
      toastMessage("error", error);
    }
  };

  const onRetake = () => {
    setFingerData({});
  };

  useEffect(() => {
    const getDataUpdate = async () => {
      handleUpdate();
    };

    getDataUpdate();
  }, [fingerData, supportingDocuments, comment]);

  const handleUpdate = async (body?: any) => {
    setUpdatedBioData &&
      setUpdatedBioData((prev: any) => ({
        ...prev,
        biometric: {
          ...prev.biometric,
          fingerprint: {
            ...(body || {}),
            rightFingersStatus:
              body?.status && body.rightFingersStatus !== "" ? "CAPTURED" : "",
            leftFingersStatus:
              body?.status && body.leftFingersStatus !== "" ? "CAPTURED" : "",
            leftThumbStatus:
              body?.status && body.leftThumbStatus !== "" ? "CAPTURED" : "",
            rightThumbStatus:
              body?.status && body.rightThumbStatus !== "" ? "CAPTURED" : "",
          },
        },
      }));
  };

  if (!enrollmentId)
    return (
      <Empty
        isFullScreen
        title={`${translation.missing_field}: enrollmentId`}
      />
    );

  return (
    <>
      <div>
        <div
          style={{ overflowY: "auto", maxHeight: "70vh", overflowX: "hidden" }}
        >
          {/* Collapsible Workflow XML Input */}
          {supportingDocuments?.length > 0 && (
            <>
              <PanelGroup accordion bordered>
                <Panel
                  header={
                    <Stack spacing={16}>
                      <IconButton circle icon={<Icon name="folder" />} />
                      <Text className="textPrimary">
                        {translation.supporting_documents}
                      </Text>
                    </Stack>
                  }
                >
                  <Upload
                    files={supportingDocuments}
                    referenceType="ENROLLMENT_FINGERPRINT"
                    referenceId={enrollmentId || ""}
                    setFiles={setSupportingDocuments}
                    showDelete={enableCapture}
                  />
                </Panel>
              </PanelGroup>
              <br />
            </>
          )}

          {/* Status Display */}
          {status && (
            <>
              <Alert type={status.type} message={status.text} />
              <br />
            </>
          )}

          <ViewComment
            comment={comment}
            enableClearComment
            setComment={setComment}
          />

          {/* Results Display */}
          <PreviewFingerprint fingerData={fingerData} />
        </div>

        {lowQualityFingersRef.current.length > 0 && (
          <Alert
            type="warning"
            title={`${lowQualityFingersRef.current.length} ${translation.fingerprints_captured_but_low_quality} (<10)`}
          >
            <TagGroup>
              {lowQualityFingersRef.current.map((finger, index) => (
                <Tag key={index}>
                  {finger.position}: {finger.quality}
                </Tag>
              ))}
            </TagGroup>
          </Alert>
        )}
        <br />

        {/* Action Buttons */}
        <div>
          {loadingDevice ? (
            <Loading />
          ) : (
            <Tag color="green" onClick={fetchDevice}>
              SN: {deviceSerialNumber}
            </Tag>
          )}
        </div>
        <br />
        <Stack>
          <Stack.Item>
            {
              <ButtonToolbar>
                <Button
                  text={translation.go_back}
                  onClick={() => setTab("iris")}
                  appearance="default"
                />
              </ButtonToolbar>
            }
          </Stack.Item>
          <Stack.Item grow={1} />
          <Stack.Item>
            <ButtonToolbar>
              {enableCapture && (
                <>
                  <Button
                    text={translation.comment}
                    onClick={() => {
                      setOpenCommentModal(true);
                      setUpdatedComment(comment);
                    }}
                    testId="comment"
                    startIcon={"add"}
                    appearance="default"
                  />
                  <Button
                    text={translation.upload_supporting_document}
                    onClick={async () => {
                      setBCKFormatData(returnBody());
                      setShowSDModal(true);
                    }}
                    testId="supportingDocument"
                    startIcon={"add"}
                    appearance="ghost"
                  />
                  {Object.keys(fingerData).length > 0 && (
                    <Button
                      text={translation.retake}
                      onClick={onRetake}
                      appearance="ghost"
                    />
                  )}

                  {isStarting && (
                    <Button
                      text={translation.cancel_capture}
                      onClick={cancelCapture}
                      appearance="primary"
                      color="red"
                    />
                  )}

                  <Button
                    text={translation.start_capture}
                    onClick={startCapture}
                    loading={isStarting}
                  />
                </>
              )}
              {lowQualityFingersRef.current.length > 0 &&
              comment === "" &&
              supportingDocuments.length === 0 ? (
                <></>
              ) : (
                <Button
                  text={
                    age <= 16
                      ? !enableCapture
                        ? translation.close
                        : translation.submit
                      : translation.next
                  }
                  onClick={() => onNext()}
                  loading={isSubmitting}
                />
              )}
            </ButtonToolbar>
          </Stack.Item>
        </Stack>
      </div>

      <Modal
        show={showSDModal}
        handleClose={() => setShowSDModal(false)}
        title={translation.supporting_document_upload}
      >
        <Upload
          setFiles={setSupportingDocuments}
          files={supportingDocuments}
          referenceType="ENROLLMENT_FINGERPRINT"
          referenceId={enrollmentId || ""}
          showUploadButton
          name="fingerprint"
          enrollmentId={enrollmentId}
          biometricData={bckFormatData}
          comment={comment}
          enableCapture={enableCapture}
          setComment={setComment}
          listComments={fingerprintComments(translation)}
        />
        <br />
        <LibModal.Footer>
          <Button
            onClick={() => setShowSDModal(false)}
            text={translation.close}
            appearance="default"
          />
          {/* {lowQualityFingersRef.current.length > 0 ? null : ( */}
          <Button
            onClick={handleSubmmitWithSD}
            text={translation.next}
            loading={isSubmittingWithSD}
            disabled={supportingDocuments?.length === 0}
          />
          {/* )} */}
        </LibModal.Footer>
      </Modal>

      {/* biometric captured status modal */}
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
          data={updatedBioData}
        />
      </Modal>

      {/* add comment modal */}
      <Comment
        openCommentModal={openCommentModal}
        setOpenCommentModal={setOpenCommentModal}
        updatedComment={updatedComment}
        setUpdatedComment={setUpdatedComment}
        setComment={setComment}
        enableCapture={enableCapture}
        listComments={fingerprintComments(translation)}
      />
    </>
  );
};

export default FingerprintCapturePage;
