import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  useContext,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useEnrollWS } from "./lib/useWebSocket";
import type { CameraDeviceInfo, CameraFormatInfo } from "./types/device";
import EnrollFromCameraActionToolbar from "./ActionToolbar";
import EnrollFromCameraAttributesPanel from "./AttributesPanel";
import EnrollFromCameraFinalToken from "./FinalToken";
import EnrollFromCameraFeed from "./LiveFeed";
import { DEFAULT_THRESHOLDS } from "./constants/defaults";
import type { LiveEnrollRequest } from "./types/enroll";
import { SelfieContext } from "@/context/SelfieContext";
import Loading from "@/components/loader";
import { BIO_AUDIT_API, BIO_AUDIT_API_KEY } from "@/constants/bioAudit";

async function fetchWithApiKey(url: string) {
  const res = await fetch(url, { headers: { "X-Api-Key": BIO_AUDIT_API_KEY } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function EnrollFromCameraTab({}) {
  const {
    data: devices = [],
    refetch,
    isFetching,
  } = useQuery<CameraDeviceInfo[]>({
    queryKey: ["devices"],
    queryFn: () => fetchWithApiKey(`${BIO_AUDIT_API}/devices`),
  });

  // ───────── State ─────────
  const [deviceId, setDeviceId] = useState<string>();
  const [selectedFormat, setSelectedFormat] = useState<CameraFormatInfo>();
  const [icao, setIcao] = useState(true);
  const [mode, setMode] = useState("off");
  const [detectLiveness, setDetectLiveness] = useState(false);
  const [livenessMode, setLivenessMode] =
    useState<LiveEnrollRequest["livenessMode"]>("Simple");
  const [interval, setIntervalMs] = useState(50);

  const [createTemplate, setCreateTemplate] = useState<boolean>(false);
  const [templateSize, setTemplateSize] =
    useState<LiveEnrollRequest["templateSize"]>("Small");

  const [minInterOcularDistance, setMinInterOcularDistance] = useState(
    DEFAULT_THRESHOLDS.minInterOcularDistance
  );
  const [faceConfidence, setFaceConfidence] = useState(
    DEFAULT_THRESHOLDS.faceConfidence
  );
  const [maxRoll, setMaxRoll] = useState(DEFAULT_THRESHOLDS.maxRoll);
  const [maxYaw, setMaxYaw] = useState(DEFAULT_THRESHOLDS.maxYaw);
  const [maxPitch, setMaxPitch] = useState(DEFAULT_THRESHOLDS.maxPitch);
  const [qualityThreshold, setQualityThreshold] = useState(
    DEFAULT_THRESHOLDS.quality
  );
  const [livenessThreshold, setLivenessThreshold] = useState(
    DEFAULT_THRESHOLDS.livenessThreshold
  );
  const [livenessConfidenceThreshold, setLivenessConfidenceThreshold] =
    useState(DEFAULT_THRESHOLDS.livenessConfidenceThreshold);

  const [tokenImageWidth, setTokenImageWidth] = useState(
    DEFAULT_THRESHOLDS.tokenImageWidth
  );
  const [tokenQualityThreshold, setTokenQualityThreshold] = useState(
    DEFAULT_THRESHOLDS.tokenQualityThreshold
  );

  const [detectAllFeaturePoints, setDetectAllFeaturePoints] = useState(true);
  const [determineGender, setDetermineGender] = useState(true);
  const [determineAge, setDetermineAge] = useState(true);
  const [detectProperties, setDetectProperties] = useState(true);
  const [additionalFacesThreshold, setAdditionalFacesThreshold] = useState(
    DEFAULT_THRESHOLDS.additionalFacesThreshold
  );

  const [createThumbnail, setCreateThumbnail] = useState(false);
  const [thumbnailWidth, setThumbnailWidth] = useState(
    DEFAULT_THRESHOLDS.thumbnailWidth
  );

  const [removeRedEyes, setRemoveRedEyes] = useState(true);
  const [removeBackgroundEnabled, setRemoveBackgroundEnabled] = useState(true);
  const [applyWhiteBackground, setApplyWhiteBackground] = useState(true);

  const { setSelfieImage, setLastMessageType, setOriginalImage } =
    useContext(SelfieContext);

  const [clearFaceVisibilityThreshold, setClearFaceVisibilityThreshold] =
    useState(80);
  const [whiteBackgroundThreshold, setWhiteBackgroundThreshold] = useState(70);
  const [eyesOpenThreshold, setEyesOpenThreshold] = useState(80);

  const [computedAttributes, setComputedAttributes] = useState<
    Record<string, number>
  >({});

  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const [tokenFaceBackgroundPercentage, setTokenFaceBackgroundPercentage] =
    useState(60);
  // const [icaoSharpnessThreshold, setIcaoSharpnessThreshold] = useState(40);
  // const [icaoFaceDarknessThreshold, setIcaoFaceDarknessThreshold] =
  //   useState(50);
  const [icaoUnnaturalSkinToneThreshold, setIcaoUnnaturalSkinToneThreshold] =
    useState(1);
  // const [icaoGlassesReflectionThreshold, setIcaoGlassesReflectionThreshold] =
  //   useState(50);
  // const [icaoResolutionThreshold, setIcaoResolutionThreshold] = useState(70);
  // const [icaoMotionBlurThreshold, setIcaoMotionBlurThreshold] = useState(10);
  // const [icaoOverexposureThreshold, setIcaoOverexposureThreshold] =
  //   useState(25);
  // const [icaoUnderexposureThreshold, setIcaoUnderexposureThreshold] =
  //   useState(20);

  const [icaoWashedOutThreshold, setIcaoWashedOutThreshold] = useState(50);
  const [
    icaoBackgroundUniformityThreshold,
    setIcaoBackgroundUniformityThreshold,
  ] = useState(0);
  const [icaoWarningsFilter, setIcaoWarningsFilter] = useState(
    "TooSouth,TooEast,TooWest,TooNorth"
  );

  // ───────── Derived thresholds ─────────
  const thresholds = useMemo(
    () => ({
      ...DEFAULT_THRESHOLDS,
      minInterOcularDistance,
      faceConfidence,
      additionalFacesThreshold,
      maxRoll,
      maxYaw,
      maxPitch,
      quality: qualityThreshold,
      livenessThreshold,
      livenessConfidenceThreshold,
      tokenImageWidth,
      tokenQualityThreshold,
      thumbnailWidth,
      clearFaceVisibilityThreshold,
      whiteBackgroundThreshold,
      eyesOpenThreshold,
    }),
    [
      minInterOcularDistance,
      faceConfidence,
      maxRoll,
      maxYaw,
      qualityThreshold,
      livenessThreshold,
      livenessConfidenceThreshold,
      tokenImageWidth,
      tokenQualityThreshold,
      thumbnailWidth,
      additionalFacesThreshold,
      maxPitch,
      clearFaceVisibilityThreshold,
      whiteBackgroundThreshold,
      eyesOpenThreshold,
    ]
  );

  // ───────── WS hook ─────────
  const { connected, reconnecting, lastMsg, connect, disconnect } =
    useEnrollWS();

  const tokenRef = useRef<HTMLImageElement>(null);

  const selectedDevice = useMemo(
    () => devices.find((d) => d.id === deviceId),
    [devices, deviceId]
  );
  //Get Quality checker

  // ───────── Process Captured Image ─────────
  useEffect(() => {
    if (lastMsg?.type === "complete" && lastMsg.payload.tokenImageBase64) {
      if (tokenRef.current) {
        const processImage = async () => {
          let originalImgSrc = `data:image/jpeg;base64,${lastMsg.payload.imageBase64}`;
          let imgSrc = `data:image/jpeg;base64,${lastMsg.payload.tokenImageBase64}`;

          setOriginalImage(originalImgSrc);

          tokenRef.current!.src = imgSrc;
          setSelfieImage(imgSrc);
          setLastMessageType(lastMsg?.type);
        };

        processImage();
      }
      setMode("off");
    }
  }, [
    lastMsg,
    removeBackgroundEnabled,
    applyWhiteBackground,
    setSelfieImage,
    setLastMessageType,
  ]);

  const forceCapture = async (tokenImage: any) => {
    let originalImgSrc = `data:image/jpeg;base64,${tokenImage.imageBase64}`;
    let imgSrc = `data:image/jpeg;base64,${tokenImage.tokenImageBase64}`;

    setOriginalImage(originalImgSrc);

    setSelfieImage(imgSrc);
    setMode("off");
  };

  // ───────── Start/Stop ─────────
  const start = useCallback(() => {
    if (!deviceId || !selectedFormat) return;

    setMode("on");

    const req: LiveEnrollRequest = {
      deviceId,
      detectLiveness,
      checkIcao: icao,
      frameInterval:
        interval && typeof interval === "string" ? Number(interval) : interval,
      livenessMode,
      width: selectedFormat.width,
      height: selectedFormat.height,
      frameRate: selectedFormat.frameRate,
      mediaSubtype: selectedFormat.mediaSubtype,
      createTemplate,
      templateSize,
      minInterOcularDistance,
      faceConfidenceThreshold:
        typeof faceConfidence === "string"
          ? Number(faceConfidence)
          : faceConfidence,
      additionalFacesThreshold:
        typeof additionalFacesThreshold === "string"
          ? Number(additionalFacesThreshold)
          : additionalFacesThreshold,
      maxRoll: typeof maxRoll === "string" ? Number(maxRoll) : maxRoll,
      maxYaw: typeof maxYaw === "string" ? Number(maxYaw) : maxYaw,
      maxPitch: typeof maxPitch === "string" ? Number(maxPitch) : maxPitch,
      qualityThreshold:
        typeof qualityThreshold === "string"
          ? Number(qualityThreshold)
          : qualityThreshold,
      livenessThreshold:
        typeof livenessThreshold === "string"
          ? Number(livenessThreshold)
          : livenessThreshold,
      livenessConfidenceThreshold:
        typeof livenessConfidenceThreshold === "string"
          ? Number(livenessConfidenceThreshold)
          : livenessConfidenceThreshold,
      tokenImageWidth:
        typeof tokenImageWidth === "string"
          ? Number(tokenImageWidth)
          : tokenImageWidth,
      tokenQualityThreshold:
        typeof tokenQualityThreshold === "string"
          ? Number(tokenQualityThreshold)
          : tokenQualityThreshold,
      detectAllFeaturePoints,
      determineGender,
      determineAge,
      detectProperties,
      createThumbnail,
      thumbnailWidth,
      removeRedEyes,
      removeBackground: removeBackgroundEnabled,
      tokenFaceBackgroundPercentage,
      // icaoSharpnessThreshold,
      // icaoFaceDarknessThreshold,
      icaoUnnaturalSkinToneThreshold,
      // icaoGlassesReflectionThreshold,
      // icaoResolutionThreshold,
      // icaoMotionBlurThreshold,
      // icaoOverexposureThreshold,
      // icaoUnderexposureThreshold,

      icaoWashedOutThreshold,
      icaoBackgroundUniformityThreshold,
      icaoWarningsFilter,
    };

    connect("/ws/enroll/live", req);
  }, [
    deviceId,
    selectedFormat,
    icao,
    detectLiveness,
    interval,
    livenessMode,
    templateSize,
    minInterOcularDistance,
    faceConfidence,
    maxRoll,
    maxYaw,
    qualityThreshold,
    livenessThreshold,
    livenessConfidenceThreshold,
    tokenImageWidth,
    tokenQualityThreshold,
    detectAllFeaturePoints,
    determineGender,
    determineAge,
    detectProperties,
    createThumbnail,
    thumbnailWidth,
    removeRedEyes,
    removeBackgroundEnabled,
    tokenFaceBackgroundPercentage,
    // icaoSharpnessThreshold,
    // icaoFaceDarknessThreshold,
    // icaoUnnaturalSkinToneThreshold,
    // icaoGlassesReflectionThreshold,
    // icaoResolutionThreshold,
    // icaoMotionBlurThreshold,
    // icaoOverexposureThreshold,
    // icaoUnderexposureThreshold,

    icaoWashedOutThreshold,
    icaoBackgroundUniformityThreshold,
    icaoWarningsFilter,
    connect,
  ]);

  const handleBackgroundAnalysis = useCallback(
    (backgroundScore: number) => {
      setComputedAttributes((prev) => ({
        ...prev,
        WhiteBackground: backgroundScore,
        BackgroundRemoved: removeBackgroundEnabled ? 100 : 0,
        ClearFaceVisibility: 80,
        BothEarsVisible: 0,
      }));
    },
    [removeBackgroundEnabled]
  );

  // ───────── UI ─────────
  return (
    <div style={{ position: "relative" }}>
      <div className="space-y-4 mb-4">
        {reconnecting && (
          <div className="alert alert-warning py-2 text-sm">
            Connection lost, attempting to reconnect...
          </div>
        )}

        {isProcessingImage && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 999,
              borderRadius: 16,
            }}
          >
            <Loading size="lg" />
          </div>
        )}

        <div className="row">
          <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
            <EnrollFromCameraActionToolbar
              devices={devices}
              deviceId={deviceId}
              detectLiveness={detectLiveness}
              setDetectLiveness={setDetectLiveness}
              setDeviceId={setDeviceId}
              selectedDevice={selectedDevice}
              selectedFormat={selectedFormat}
              setSelectedFormat={setSelectedFormat}
              icao={icao}
              setIcao={setIcao}
              livenessMode={livenessMode}
              setLivenessMode={setLivenessMode}
              interval={interval}
              setIntervalMs={setIntervalMs}
              refetch={refetch}
              isFetching={isFetching}
              connected={connected}
              start={start}
              disconnect={disconnect}
              lastMsg={lastMsg as any}
              createTemplate={createTemplate}
              setCreateTemplate={setCreateTemplate}
              templateSize={templateSize}
              setTemplateSize={setTemplateSize}
              minInterOcularDistance={minInterOcularDistance}
              setMinInterOcularDistance={setMinInterOcularDistance}
              faceConfidence={faceConfidence}
              setFaceConfidence={setFaceConfidence}
              maxRoll={maxRoll}
              setMaxRoll={setMaxRoll}
              maxYaw={maxYaw}
              setMaxYaw={setMaxYaw}
              qualityThreshold={qualityThreshold}
              setQualityThreshold={setQualityThreshold}
              livenessThreshold={livenessThreshold}
              setLivenessThreshold={setLivenessThreshold}
              livenessConfidenceThreshold={livenessConfidenceThreshold}
              setLivenessConfidenceThreshold={setLivenessConfidenceThreshold}
              tokenImageWidth={tokenImageWidth}
              setTokenImageWidth={setTokenImageWidth}
              tokenQualityThreshold={tokenQualityThreshold}
              setTokenQualityThreshold={setTokenQualityThreshold}
              detectAllFeaturePoints={detectAllFeaturePoints}
              setDetectAllFeaturePoints={setDetectAllFeaturePoints}
              determineGender={determineGender}
              setDetermineGender={setDetermineGender}
              determineAge={determineAge}
              setDetermineAge={setDetermineAge}
              detectProperties={detectProperties}
              setDetectProperties={setDetectProperties}
              createThumbnail={createThumbnail}
              setCreateThumbnail={setCreateThumbnail}
              thumbnailWidth={thumbnailWidth}
              setThumbnailWidth={setThumbnailWidth}
              removeRedEyes={removeRedEyes}
              setRemoveRedEyes={setRemoveRedEyes}
              removeBackground={removeBackgroundEnabled}
              setRemoveBackground={setRemoveBackgroundEnabled}
              applyWhiteBackground={applyWhiteBackground}
              setApplyWhiteBackground={setApplyWhiteBackground}
              maxPitch={maxPitch}
              setMaxPitch={setMaxPitch}
              additionalFacesThreshold={additionalFacesThreshold}
              setAdditionalFacesThreshold={setAdditionalFacesThreshold}
              forceCapture={forceCapture}
              setClearFaceVisibilityThreshold={setClearFaceVisibilityThreshold}
              clearFaceVisibilityThreshold={clearFaceVisibilityThreshold}
              setEyesOpenThreshold={setEyesOpenThreshold}
              whiteBackgroundThreshold={whiteBackgroundThreshold}
              setWhiteBackgroundThreshold={setWhiteBackgroundThreshold}
              eyesOpenThreshold={eyesOpenThreshold}
            />
          </div>

          <div
            className="col-md-4"
            style={{
              maxHeight: "65vh",
              overflowY: "auto",
            }}
          >
            <EnrollFromCameraAttributesPanel
              lastMsg={lastMsg as any}
              icao={icao}
              thresholds={thresholds}
              computedAttributes={computedAttributes}
              mode={mode}
            />
          </div>

          <div className="col-md-8" style={{ position: "relative" }}>
            {lastMsg?.type === "complete" ? (
              <center>
                <div style={{ width: "60%" }}>
                  <EnrollFromCameraFinalToken
                    tokenRef={tokenRef}
                    lastMsg={lastMsg as any}
                  />
                </div>
              </center>
            ) : (
              <EnrollFromCameraFeed
                lastMsg={lastMsg as any}
                livenessMode={livenessMode}
                removeBackground={removeBackgroundEnabled}
                applyWhiteBackground={applyWhiteBackground}
              />
            )}
            {}
          </div>
        </div>
      </div>
    </div>
  );
}
