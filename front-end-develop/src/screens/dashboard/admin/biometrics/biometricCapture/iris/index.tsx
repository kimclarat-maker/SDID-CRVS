import Button from "@/components/button";
import { LanguageContext } from "@/context/LanguageContext";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ButtonToolbar,
  Stack,
  Modal as LibModal,
  PanelGroup,
  Text,
  Panel,
} from "rsuite";
import IrisCapture from "./iris";
import toastMessage from "@/utils/common/toastMessage";
import {
  abortIrisDevice,
  closeIrisDevice,
  fetchLastAsBase64,
  manualCaptureIrisDevice,
  openIrisDevice,
  startIrisDevice,
} from "@/api/iris";
import { useFormik } from "formik";
import { IrisTypes } from "@/types/IrisTypes";
import { irisValidationSchema } from "@/validation/iris.validation";
import IrisSpecsForm from "@/components/forms/irisSpecs";
import "@/socket/iris";
import { onAddIRIS } from "@/api/enrollments";
import Upload from "@/components/supportingDocuments/upload";
import { isDemoMode } from "@/demo/config";
import Modal from "@/components/Modal";
import { EnrollmentType } from "@/types/Enrollment";
import Alert from "@/components/alert";
import Comment from "@/components/comment";
import ViewComment from "@/components/comment/viewComment";
import { useParams, useSearchParams } from "react-router-dom";
import { irisComments } from "@/constants/comments";
import { isUUID } from "@/utils/common/uuid";
import { cfg } from "@/constants/cfg";
import { useUploadBioData } from "@/hooks/useUploadMedia";

const API_BASE = "https://localhost:9991"; // adjust as needed
const BIN_WS_URL = `${API_BASE.replace("https", "wss").replace(
  "http",
  "ws"
)}/ws/iris-live`;

interface Props {
  setTab: (tab: string) => void;
  nextTab: string;
  activeTab?: string;
  enrollmentId: string;
  enableCapture: boolean;
  isBioRefresh: boolean;
  bioRefreshToken?: string;
  enrollmentData: EnrollmentType;
  deviceSerialNumber?: string;
  setUpdatedBioData: (data: any) => void;
}

interface IrisDataType {
  leftIris?: string;
  rightIris?: string;
  preview?: any;
}

const Iris: React.FC<Props> = ({
  setTab,
  nextTab,
  activeTab,
  enrollmentId,
  enableCapture,
  isBioRefresh,
  bioRefreshToken,
  enrollmentData,
  deviceSerialNumber,
  setUpdatedBioData,
}) => {
  const { translation } = useContext(LanguageContext);

  const [irisData, setIrisData] = useState<IrisDataType | any>(null);
  const [supportingDocuments, setSupportingDocuments] = useState<any[]>([]);
  const [showSDModal, setShowSDModal] = useState(false);
  const [isSubmittingWithSD, setSubmittingWithSD] = useState(false);
  const [bckFormatData, setBCKFormatData] = useState({});
  const [errorDeviceMessage, setErrorDeviceMessage] = useState("");
  const [status, setStatus] = useState<{
    text: string;
    type: "error" | "success" | "info" | "warning";
  } | null>(null);

  // UI flags
  const [isOpen, setIsOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isStarting, setStarting] = useState(false);
  const [isAborting, setAborting] = useState(false);
  const [isClosing, setClosing] = useState(false);
  const [isManualCapturing, setManualCapturing] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [comment, setComment] = useState<any>();
  const [updatedComment, setUpdatedComment] = useState<any>();
  const [openCommentModal, setOpenCommentModal] = useState(false);
  const { bioToken } = useParams();
  const [] = useState(false);
  const { uploadBioData } = useUploadBioData();
  const [searchParams] = useSearchParams();
  const isStartedOnline = searchParams.get("isStartedOnline") === "true";

  // Consolidated canvas refs - using only one set
  const canvases = {
    0: useRef<HTMLCanvasElement>(null), // right eye
    1: useRef<HTMLCanvasElement>(null), // left eye
  };

  // binary ws & stomp refs
  const binWsRef = useRef<WebSocket | null>(null);
  const expectFrameHeaderRef = useRef<any>(null);
  const reconnectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!deviceSerialNumber) {
      setErrorDeviceMessage(translation.no_device_connected);
    } else {
      setErrorDeviceMessage("");
    }
  }, [deviceSerialNumber]);

  useEffect(() => {
    try {
      const init = async () => {
        const irisData = enrollmentData.biometric?.iris;

        let { preview, supportingDocuments, comment } = irisData || {};

        const parsed = preview ? JSON.parse(preview || {}) : {};

        setComment(comment);
        setSupportingDocuments(supportingDocuments);
        setIrisData({ ...irisData, preview: parsed });

        // draw any existing images to canvases
        if (parsed?.leftIris) {
          drawImageToCanvas(parsed.leftIris, canvases[1].current);
        }
        if (parsed?.rightIris) {
          drawImageToCanvas(preview.rightIris, canvases[0].current);
        }
      };
      init();
    } catch (error) {
      console.error("Error parse preview:", error);
    }
  }, [enrollmentData]);

  // Demo mode has no real iris scanner, and this screen's "Next" button is
  // gated on supportingDocuments being non-empty (not on an actual scan) —
  // auto-attach a placeholder document so the wizard can still be clicked
  // through end-to-end (spec: auto-simulate capture steps with dummy data).
  useEffect(() => {
    if (isDemoMode() && (!supportingDocuments || supportingDocuments.length === 0)) {
      setSupportingDocuments([
        { _id: "demo-iris-doc", name: "Demo supporting document.pdf" },
      ] as any);
    }
  }, [supportingDocuments]);

  const resetCanvas = useCallback(() => {
    // Clear all canvases
    Object.values(canvases).forEach((ref) => {
      const canvas = ref.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Reset canvas dimensions to clear completely
          canvas.width = canvas.width;
        }
      }
    });

    setIrisData(null);
  }, []);

  const validationSchema = useMemo(
    () => irisValidationSchema(translation),
    [translation]
  );

  const formik = useFormik<IrisTypes>({
    initialValues: {
      mode: 1,
      captureType: 0,
      eye: 3,
      priority: 1,
      timeoutSeconds: 30,
      imageType: 6,
      lensDetection: 0,
      includeVga: false,
      illumination: true,
      beeper: true,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setIrisData(null);
        resetCanvas(); // Use resetCanvas instead of manually setting refs to null
        await onStart(values);
      } catch (error: any) {
        setStatus({
          text: error?.response?.message || error?.message || String(error),
          type: "error",
        });
        toastMessage("error", error);
      }
    },
    enableReinitialize: true,
  });

  // Helper: draw base64 image to canvas
  const drawImageToCanvas = useCallback(
    (base64Data: string, canvas: HTMLCanvasElement | null) => {
      if (!canvas || !base64Data) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.onerror = (e) => {
        console.error("Failed to load base64 image", e);
      };
      img.src = base64Data;
    },
    []
  );

  // Convert a canvas to base64 only if it has content
  const getConvertBase64 = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    try {
      const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      ).data;
      const hasContent = Array.from(imageData).some((channel) => channel !== 0);
      if (!hasContent) return undefined;
      return canvas.toDataURL("image/png");
    } catch (err) {
      // canvas might be tainted in some contexts
      console.warn("getConvertBase64 failed:", err);
      return undefined;
    }
  }, []);

  useEffect(() => {
    if (formik.values.captureType === 1) {
      formik.setFieldValue("priority", 0);
    }
  }, [formik.values.captureType]);

  // Binary WebSocket handling
  const startBinaryWs = useCallback(() => {
    if (!enableCapture) return;
    // avoid multiple sockets

    if (
      binWsRef.current &&
      (binWsRef.current.readyState === WebSocket.OPEN ||
        binWsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      const ws = new WebSocket(BIN_WS_URL);
      ws.binaryType = "arraybuffer";
      binWsRef.current = ws;
      expectFrameHeaderRef.current = null;

      ws.onopen = () => {
        // setStatus({ text: "Binary WS connected", type: "success" });
        console.log("Binary WS connected");
      };

      ws.onclose = (ev) => {
        // setStatus({ text: "Binary WS closed", type: "warning" });
        console.log("Binary WS closed");
        // attempt reconnect with backoff
        if (reconnectTimerRef.current)
          window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = window.setTimeout(
          () => startBinaryWs(),
          3000
        );
      };

      ws.onerror = (err) => {
        console.error("Binary WS error:", err);
        // setStatus({ text: "Binary WS error", type: "error" });
      };

      ws.onmessage = (evt) => {
        // text header
        if (typeof evt.data === "string") {
          try {
            const msg = JSON.parse(evt.data);
            if (msg.type === "frame") {
              expectFrameHeaderRef.current = msg;
            } else if (msg.type === "status") {
              // example: { deviceOpen: true, deviceCapturing: false }
              setIsOpen(Boolean(msg.deviceOpen));
              // setIsCapturing(Boolean(msg.deviceCapturing));
            } else {
              // other text messages
              console.debug("binary ws text msg:", msg);
            }
          } catch (e) {
            console.debug("non-json text message", evt.data);
          }
          return;
        }
        // binary payload follows a 'frame' header
        const header = expectFrameHeaderRef.current;
        expectFrameHeaderRef.current = null;
        if (!header) return;
        const eye = header.eye === 0 ? 0 : 1;
        const w = header.w || header.width;
        const h = header.h || header.height;
        const bytes = new Uint8ClampedArray(evt.data);
        drawGray(eye, w, h, bytes);
      };
    } catch (err) {
      console.error("startBinaryWs failed:", err);
      setStatus({ text: "Failed to start binary websocket", type: "error" });
    }
  }, [enableCapture, getConvertBase64]);

  // draw grayscale bytes to canvas
  function drawGray(
    eye: number,
    w: number,
    h: number,
    bytes: Uint8ClampedArray
  ) {
    const canvas = canvases[eye as 0 | 1]?.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const imgData = ctx.createImageData(w, h);
    const d = imgData.data;
    let p = 0;
    for (let i = 0; i < bytes.length; i++) {
      const v = bytes[i];
      d[p] = v;
      d[p + 1] = v;
      d[p + 2] = v;
      d[p + 3] = 255;
      p += 4;
    }
    ctx.putImageData(imgData, 0, 0);

    if (canvas) {
      const base64 = getConvertBase64(canvas);

      const irisName = eye === 0 ? "rightIris" : "leftIris";

      setIrisData((prev: any) => ({
        ...(prev || {}),
        preview: { ...(prev?.preview || {}), [irisName]: base64 },
      }));
    }
  }

  // start/stop lifecycle hooks tied to active tab and enableCapture
  useEffect(() => {
    if (!enableCapture) return;
    if (activeTab === "iris") {
      startBinaryWs();
    } else {
      // close binary ws if tab not active
      if (binWsRef.current) {
        try {
          binWsRef.current.close();
        } catch (e) {}
        binWsRef.current = null;
      }
    }
    // cleanup on unmount
    return () => {
      if (binWsRef.current) {
        try {
          binWsRef.current.close();
        } catch (e) {}
        binWsRef.current = null;
      }
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [activeTab, enableCapture, startBinaryWs]);

  // device open/close/start/abort handlers
  const onOpen = async () => {
    try {
      setIsOpening(true);
      const data = await openIrisDevice();
      if (data?.success) {
        setIsOpen(true);
        // setStatus({ text: "Iris device opened successfully", type: "success" });
      } else {
        setIsOpen(false);
        toastMessage(
          "error",
          "Unable to connect iris device, make sure it is plugged in"
        );
      }
      setIsOpening(false);
    } catch (error: any) {
      setIsOpen(false);
      setIsOpening(false);
      toastMessage("error", error);
      setStatus({
        text: error?.message || "Open device failed",
        type: "error",
      });
    }
  };

  const onStart = async (values: any) => {
    try {
      setStarting(true);
      resetCanvas();
      setIrisData(null);
      const res = await startIrisDevice(values);
      if (res?.success) {
        setIsCapturing(true);
      } else {
        setIsCapturing(false);
      }
      setStarting(false);
    } catch (error: any) {
      setIsCapturing(false);
      const msg =
        error?.response?.data?.message || error?.message || String(error);
      setStatus({ text: msg, type: "error" });
      toastMessage("error", msg);
      setStarting(false);
    }
  };

  const onClose = async () => {
    setStatus({ text: "Iris device is closing...", type: "info" });
    setClosing(true);
    try {
      await closeIrisDevice();
      setIsOpen(false);
      setIsCapturing(false);
      setStatus({ text: "Iris device closed successfully", type: "success" });
      setClosing(false);
    } catch (error: any) {
      toastMessage("error", error);
      setStatus({
        text: error?.response?.data?.message || error?.message || String(error),
        type: "error",
      });
      setClosing(false);
    }
  };

  const onAbort = async () => {
    setAborting(true);
    try {
      await abortIrisDevice();
      setIsCapturing(false);
      setAborting(false);
      setIrisData(null);
      resetCanvas();
    } catch (error) {
      toastMessage("error", error);
      setAborting(false);
    }
  };

  const onManualCapture = async () => {
    setManualCapturing(true);
    setStatus({ text: "Iris device is capturing (manual)...", type: "info" });
    try {
      const data = await manualCaptureIrisDevice();
      setManualCapturing(false);
      if (data?.success && data.data) {
        // expected shape: { leftEye: 'data:image/png;base64,...', rightEye: '...' } or similar
        readIrisContent(data.data, "manual");
        setStatus({ text: "Manual capture successful", type: "success" });
        return;
      }
      toastMessage("error", "Wrong data format captured");
      setStatus({ text: "Wrong data format captured", type: "error" });
    } catch (error) {
      toastMessage("error", error);
      setStatus({ text: "Manual capture failed", type: "error" });
      setManualCapturing(false);
    }
  };

  const getLastImage = async (position: "left" | "right") => {
    try {
      const res = await fetchLastAsBase64(position);

      const base64 = res.base64.startsWith("data:") ? res.data : res.base64;

      return base64;
    } catch (error: any) {
      return null;
    }
  };

  const readIrisContent = (data: any, type?: string) => {
    if (type === "manual") {
      // data may contain leftEye and rightEye
      setIrisData(data);
      if (data.leftEye) drawImageToCanvas(data.leftEye, canvases[1].current);
      if (data.rightEye) drawImageToCanvas(data.rightEye, canvases[0].current);
    }
  };

  const returnBody = async (isReady?: boolean) => {
    const rightImage =
      (formik.values.eye === 3 || formik.values.eye === 1) && isCapturing
        ? await getLastImage("right")
        : null;
    const leftImage =
      (formik.values.eye === 3 || formik.values.eye === 2) && isCapturing
        ? await getLastImage("left")
        : null;

    let leftIris = irisData?.leftIris;
    let rightIris = irisData?.rightIris;
    let preview =
      typeof irisData.preview === "string"
        ? JSON.parse(irisData.preview)
        : irisData.preview;
    let previewData: any = isCapturing
      ? { ...preview, ...formik.values }
      : irisData.preview;
    let leftIrisMediaId = leftIris;
    let rightIrisMediaId = rightIris;
    let leftIrisPreviewMediaId = previewData.leftIris;
    let rightIrisPreviewMediaId = previewData.rightIris;

    if (isReady && isCapturing) {
      const headers = {
        "x-sdid-api-key": cfg.VITE_API_KEY,
        "x-sdid-api-secret-key": cfg.VITE_API_SECRET_KEY,
      };

      if (rightImage && !isUUID(rightIris)) {
        rightIrisMediaId = await uploadBioData({
          enableQualityChecker: false,
          base64Input: rightImage,
          referenceType: "ENROLLMENT_IRIS",
          referenceId: enrollmentId,
          myHeaders: headers,
        });
      }

      if (leftImage && !isUUID(leftIris)) {
        leftIrisMediaId = await uploadBioData({
          enableQualityChecker: false,
          base64Input: leftImage,
          referenceType: "ENROLLMENT_IRIS",
          referenceId: enrollmentId,
          myHeaders: headers,
        });
      }

      if (previewData?.leftIris && !isUUID(previewData?.leftIris)) {
        leftIrisPreviewMediaId = await uploadBioData({
          enableQualityChecker: true,
          base64Input: previewData?.leftIris,
          referenceType: "ENROLLMENT_IRIS",
          referenceId: enrollmentId,
          myHeaders: headers,
          position: "Left",
        });

        previewData.leftIris = leftIrisPreviewMediaId?.data?._id;
      }

      if (previewData?.rightIris && !isUUID(previewData?.rightIris)) {
        rightIrisPreviewMediaId = await uploadBioData({
          enableQualityChecker: false,
          base64Input: previewData?.rightIris,
          referenceType: "ENROLLMENT_IRIS",
          referenceId: enrollmentId,
          myHeaders: headers,
          position: "Right",
        });

        previewData.rightIris = rightIrisPreviewMediaId?.data?._id;
      }
    }

    // Right Iris
    if (rightIrisPreviewMediaId?.qualityCheckedData) {
      previewData.rightSettings = rightIrisPreviewMediaId?.qualityCheckedData;
    }

    // Left Iris
    if (leftIrisPreviewMediaId?.qualityCheckedData) {
      previewData.leftSettings = leftIrisPreviewMediaId.qualityCheckedData;
    }

    let finalBody = {
      enrollmentId,
      leftIris: leftIrisMediaId?.data?._id || leftIrisMediaId,
      rightIris: rightIrisMediaId?.data?._id || rightIrisMediaId,
      supportingDocuments: supportingDocuments?.map(
        (item: any) => item._id || item
      ),
      preview:
        typeof previewData === "object"
          ? JSON.stringify(previewData)
          : previewData,
      deviceSerialNumber,
      comment: comment?.value || comment,
      bioRefreshToken,
    };

    setIrisData({ ...finalBody, preview: previewData });

    return finalBody;
  };

  const getBioCaptureStatus = (body: any) => {
    const mandatoryBioData = ["leftIris", "rightIris"];

    let status = "CAPTURED";
    Object.keys(body).forEach((key) => {
      if (mandatoryBioData.includes(key) && (!body[key] || body[key] === "")) {
        status = "CAPTURED_WITH_SUPPORTING_DOCUMENT";
      }
    });

    return status;
  };
  // submit handlers
  const handleSubmit = async () => {
    try {
      if (!enableCapture && (!bioRefreshToken || bioRefreshToken === ""))
        return setTab(nextTab);
      if (!canvases || Object.keys(canvases).length === 0) return;

      setSubmitting(true);

      const body: any = await returnBody(true);
      const status = getBioCaptureStatus(body);
      setBCKFormatData(body);
      const { message } = await onAddIRIS(
        body,
        isBioRefresh,
        bioToken,
        isStartedOnline
      );
      handleUpdate({ status, ...body });
      setTab(nextTab);
      toastMessage("success", message);
      setShowSDModal(false);
      setSubmitting(false);
    } catch (error: any) {
      setSubmitting(false);
      if (error?.response?.data?.message?.toUpperCase().includes("MISSING")) {
        setShowSDModal(true);
        return;
      }
      toastMessage("error", error);
    }
  };

  const handleSubmitWithSD = async () => {
    try {
      if (!enableCapture) return setTab(nextTab);
      if (!canvases || Object.keys(canvases).length === 0) return;

      setSubmittingWithSD(true);

      const body: any = await returnBody(true);
      const status = getBioCaptureStatus(body);
      const { message } = await onAddIRIS(
        body,
        isBioRefresh,
        bioToken,
        isStartedOnline
      );
      setSubmittingWithSD(false);
      handleUpdate({ status, ...body });
      setTab(nextTab);
      toastMessage("success", message);
      setShowSDModal(false);
    } catch (error: any) {
      setSubmittingWithSD(false);
      toastMessage("error", error);
    }
  };

  const handleUpdate = async (payload: any = {}) => {
    const body = {
      iris: {
        ...payload,
        supportingDocuments,
        comment,
        irisStatus: payload?.status,
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

  // render
  return (
    <>
      <div
        style={{ maxHeight: "70vh", overflowY: "auto", overflowX: "hidden" }}
      >
        {errorDeviceMessage && enableCapture && (
          <>
            <Alert type="error">{errorDeviceMessage}</Alert>
            <br />
          </>
        )}
        {status?.text && status?.text !== "" && (
          <>
            <Alert type={status?.type || "error"}>{status.text}</Alert>
            <br />
          </>
        )}

        <ViewComment comment={comment} />

        <div className="row">
          {enableCapture && (
            <div
              className="col-md-3"
              style={{ height: "50vh", overflowY: "auto" }}
            >
              <IrisSpecsForm
                {...formik}
                enableCapture={enableCapture}
                deviceSerialNumber={deviceSerialNumber}
              />
            </div>
          )}

          <div className={enableCapture ? "col-md-9" : "col-md-12"}>
            {supportingDocuments?.length > 0 && (
              <>
                <br />
                <PanelGroup accordion bordered>
                  <Panel
                    header={
                      <Text className="textPrimary">
                        {translation.supporting_documents}
                      </Text>
                    }
                  >
                    <br />
                    <Upload
                      files={supportingDocuments}
                      showDelete={enableCapture}
                      referenceType="ENROLLMENT_IRIS"
                      referenceId={enrollmentId || ""}
                      setFiles={setSupportingDocuments}
                    />
                  </Panel>
                </PanelGroup>
                <br />
              </>
            )}

            <div className="row">
              <>
                <IrisCapture
                  size={6}
                  title={translation.right_eye}
                  canvasRef={canvases[0]}
                  image={!isCapturing && irisData?.preview?.rightIris}
                />
                <IrisCapture
                  size={6}
                  title={translation.left_eye}
                  canvasRef={canvases[1]}
                  image={!isCapturing && irisData?.preview?.leftIris}
                />
              </>
            </div>
          </div>
        </div>
      </div>

      <br />
      <Stack>
        <Stack.Item grow={1}>
          <ButtonToolbar>
            <Button
              text={translation.go_back}
              onClick={() => setTab("photo")}
              appearance="default"
            />
            {isOpen && (
              <Button
                text={translation.close}
                onClick={onClose}
                appearance="primary"
                color="red"
                loading={isClosing}
              />
            )}
          </ButtonToolbar>
        </Stack.Item>

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
                  onClick={() => {
                    setShowSDModal(true);
                  }}
                  testId="supportingDocument"
                  startIcon={"add"}
                  appearance="ghost"
                />
              </>
            )}
            {isOpen ? (
              <>
                {isCapturing && (
                  <Button
                    text={translation.abort}
                    onClick={onAbort}
                    appearance="primary"
                    color="red"
                    loading={isAborting}
                  />
                )}
                <Button
                  text={translation.start_capture}
                  onClick={formik.handleSubmit}
                  appearance="primary"
                  loading={isStarting}
                  disabled={isCapturing}
                />
              </>
            ) : (
              enableCapture && (
                <>
                  <Button
                    text={translation.open_device}
                    onClick={onOpen}
                    appearance="primary"
                    loading={isOpening}
                  />
                  {/* <Button
                    text={translation.manual_capture}
                    onClick={onManualCapture}
                    appearance="primary"
                    loading={isManualCapturing}
                  /> */}
                </>
              )
            )}

            <Button
              text={translation.next}
              onClick={handleSubmit}
              loading={isSubmitting}
            />
          </ButtonToolbar>
        </Stack.Item>
      </Stack>

      <Modal
        show={showSDModal}
        handleClose={() => setShowSDModal(false)}
        title={translation.supporting_document}
      >
        <Upload
          setFiles={setSupportingDocuments}
          files={supportingDocuments}
          referenceType="ENROLLMENT_IRIS"
          referenceId={enrollmentId || ""}
          showUploadButton
          name="iris"
          enrollmentId={enrollmentId}
          biometricData={{
            leftIris: irisData?.leftIris,
          }}
          comment={comment}
          enableCapture={enableCapture}
          setComment={setComment}
          listComments={irisComments(translation)}
        />
        <br />
        <LibModal.Footer>
          <Button
            onClick={() => setShowSDModal(false)}
            text={translation.close}
            appearance="default"
          />
          <Button
            onClick={handleSubmitWithSD}
            text={translation.next}
            loading={isSubmittingWithSD}
            disabled={supportingDocuments?.length === 0}
          />
        </LibModal.Footer>
      </Modal>

      <Comment
        openCommentModal={openCommentModal}
        setOpenCommentModal={setOpenCommentModal}
        updatedComment={updatedComment}
        setUpdatedComment={setUpdatedComment}
        setComment={setComment}
        enableCapture={enableCapture}
        listComments={irisComments(translation)}
      />
    </>
  );
};

export default Iris;
