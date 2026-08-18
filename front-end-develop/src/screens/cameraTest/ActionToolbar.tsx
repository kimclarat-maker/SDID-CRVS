import { useContext, useEffect, useState } from "react";
import {
  Panel,
  Button,
  ButtonGroup,
  SelectPicker,
  Checkbox,
  CheckboxGroup,
  InputNumber,
  Toggle,
  Form,
  Divider,
  IconButton,
  Tooltip,
  Whisper,
  Col,
  Row,
  Grid,
  FlexboxGrid,
  Stack,
  PanelGroup,
} from "rsuite";
import { Reload, Gear } from "@rsuite/icons";
import type { CameraDeviceInfo, CameraFormatInfo } from "./types/device";
import type { LiveEnrollMessage, LiveEnrollRequest } from "./types/enroll";
import { DEFAULT_THRESHOLDS } from "./constants/defaults";
import Icon from "@/components/icon";
import { LanguageContext } from "@/context/LanguageContext";
import { accessRoleName } from "@/utils/common/permissions";
import { generateTokenImage } from "./tokenImageApi";

type Props = {
  devices: CameraDeviceInfo[];
  deviceId?: string;
  setDeviceId: (id?: string) => void;
  selectedDevice?: CameraDeviceInfo;
  selectedFormat?: CameraFormatInfo;
  setSelectedFormat: (fmt?: CameraFormatInfo) => void;

  icao: boolean;
  setIcao: (v: boolean) => void;

  detectLiveness: boolean;
  setDetectLiveness: (v: boolean) => void;

  livenessMode: LiveEnrollRequest["livenessMode"];
  setLivenessMode: (v: LiveEnrollRequest["livenessMode"]) => void;

  interval: any;
  setIntervalMs: (n: any) => void;

  templateSize: LiveEnrollRequest["templateSize"];
  setTemplateSize: (v: LiveEnrollRequest["templateSize"]) => void;

  minInterOcularDistance: number;
  setMinInterOcularDistance: (n: any) => void;

  faceConfidence: number;
  setFaceConfidence: (n: any) => void;

  maxRoll: number;
  setMaxRoll: (n: any) => void;

  maxYaw: number;
  setMaxYaw: (n: any) => void;

  qualityThreshold: number;
  setQualityThreshold: (n: any) => void;

  livenessThreshold: number;
  setLivenessThreshold: (n: any) => void;

  livenessConfidenceThreshold: number;
  setLivenessConfidenceThreshold: (n: any) => void;

  tokenImageWidth: number;
  setTokenImageWidth: (n: any) => void;

  tokenQualityThreshold: number;
  setTokenQualityThreshold: (n: any) => void;

  detectAllFeaturePoints: boolean;
  setDetectAllFeaturePoints: (b: boolean) => void;

  determineGender: boolean;
  setDetermineGender: (b: boolean) => void;

  determineAge: boolean;
  setDetermineAge: (b: boolean) => void;

  detectProperties: boolean;
  setDetectProperties: (b: boolean) => void;

  createThumbnail: boolean;
  setCreateThumbnail: (b: boolean) => void;

  thumbnailWidth: number;
  setThumbnailWidth: (n: any) => void;

  removeRedEyes: boolean;
  setRemoveRedEyes: (b: boolean) => void;

  createTemplate: boolean;
  setCreateTemplate: (b: boolean) => void;

  removeBackground: boolean;
  setRemoveBackground: (b: boolean) => void;

  maxPitch: number;
  setMaxPitch: (n: any) => void;

  additionalFacesThreshold: number;
  setAdditionalFacesThreshold: (n: any) => void;

  isFetching: boolean;
  refetch: () => void;

  connected: boolean;
  start: () => void;
  disconnect: () => void;

  lastMsg: LiveEnrollMessage | null;

  forceCapture: (tokenImage: any) => void;

  setClearFaceVisibilityThreshold: (n: any) => void;
  clearFaceVisibilityThreshold: number;
  setEyesOpenThreshold: (n: any) => void;
  whiteBackgroundThreshold: number;
  setWhiteBackgroundThreshold: (n: any) => void;
  eyesOpenThreshold: number;

  applyWhiteBackground: boolean;
  setApplyWhiteBackground: (b: boolean) => void;
};

const livenessModeOptions = [
  { label: "Simple", value: "Simple" },
  { label: "Passive", value: "Passive" },
  { label: "Active", value: "Active" },
  { label: "Passive and Active", value: "PassiveAndActive" },
  { label: "Custom", value: "Custom" },
  { label: "Passive with Blink", value: "PassiveWithBlink" },
];

const templateSizeOptions = [
  { label: "Small", value: "Small" },
  { label: "Medium", value: "Medium" },
  { label: "Large", value: "Large" },
];

export default function EnrollFromCameraActionToolbar({
  devices,
  deviceId,
  setDeviceId,
  selectedDevice,
  selectedFormat,
  setSelectedFormat,
  icao,
  setIcao,
  detectLiveness,
  setDetectLiveness,
  livenessMode,
  setLivenessMode,
  interval,
  setIntervalMs,
  templateSize,
  setTemplateSize,
  minInterOcularDistance,
  setMinInterOcularDistance,
  faceConfidence,
  setFaceConfidence,
  maxRoll,
  setMaxRoll,
  maxYaw,
  setMaxYaw,
  qualityThreshold,
  maxPitch,
  setMaxPitch,
  setQualityThreshold,
  livenessThreshold,
  setLivenessThreshold,
  livenessConfidenceThreshold,
  setLivenessConfidenceThreshold,
  tokenImageWidth,
  setTokenImageWidth,
  tokenQualityThreshold,
  setTokenQualityThreshold,
  detectAllFeaturePoints,
  setDetectAllFeaturePoints,
  determineGender,
  setDetermineGender,
  determineAge,
  setDetermineAge,
  detectProperties,
  setDetectProperties,
  createThumbnail,
  setCreateThumbnail,
  thumbnailWidth,
  setThumbnailWidth,
  removeRedEyes,
  setRemoveRedEyes,
  removeBackground,
  setRemoveBackground,
  additionalFacesThreshold,
  setAdditionalFacesThreshold,
  createTemplate,
  setCreateTemplate,
  isFetching,
  refetch,
  connected,
  start,
  disconnect,
  lastMsg,
  forceCapture,
  clearFaceVisibilityThreshold,
  setClearFaceVisibilityThreshold,
  whiteBackgroundThreshold,
  setWhiteBackgroundThreshold,
  setEyesOpenThreshold,
  eyesOpenThreshold,
}: Props) {
  const { translation } = useContext(LanguageContext);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  const roleName = accessRoleName();
  const isSuperAdmin = roleName === "superAdmin";

  const parseNum = (val: string, fallback: number) =>
    isNaN(parseInt(val)) ? fallback : parseInt(val);

  useEffect(() => {
    if (connected && !!lastMsg?.type && lastMsg?.type !== "frame") {
      disconnect();
    }
  }, [lastMsg?.type]);

  // Auto-select first device and format only once when devices are loaded
  useEffect(() => {
    if (devices.length > 0 && !deviceId && !hasAutoSelected) {
      const firstDevice = devices[0];
      setDeviceId(firstDevice.id);
      setHasAutoSelected(true);
    }
  }, [devices, deviceId, hasAutoSelected, setDeviceId]);

  // Auto-select format when device changes
  useEffect(() => {
    if (
      selectedDevice &&
      Array.isArray(selectedDevice.formats) &&
      selectedDevice.formats.length > 0 &&
      !selectedFormat
    ) {
      const preferredFormat =
        selectedDevice.formats.find(
          (format) => format.label === "2YUY, 1920x1080p, 60 fps, 16:9"
        ) || selectedDevice.formats[0];

      setSelectedFormat(preferredFormat);
    }
  }, [selectedDevice, selectedFormat, setSelectedFormat]);

  const deviceOptions: any[] = devices
    .map((device) => {
      if (device && device.displayName?.toUpperCase()?.includes("ANKERWORK")) {
        return {
          label: `${device.displayName} ${
            device.serialNumber ? `(${device.serialNumber})` : ""
          }`,
          value: device.id,
        };
      }
      return null;
    })
    .filter(Boolean);

  const formatOptions: any[] = (selectedDevice?.formats || [])
    .map((format) => {
      return {
        label: format.label,
        value: format.label,
      };
    })
    .filter(Boolean);

  if (deviceOptions.length > 0) {
    setDeviceId(deviceOptions[0].value);
  }

  return (
    <>
      {/* Main Controls */}
      <Stack>
        <Stack.Item>
          <SelectPicker
            data={deviceOptions || []}
            value={deviceId}
            onChange={(value) => {
              setDeviceId(value || undefined);
              setSelectedFormat(undefined);
              setHasAutoSelected(true); // Mark as manually selected
            }}
            // placeholder={translation.select}
            disabled={isFetching}
            style={{
              width: "100%",
              border: "1px solid var(--rs-gray-300)",
              borderRadius: 8,
            }}
          />
        </Stack.Item>
        <Stack.Item grow={1} />
        <Stack.Item>
          <ButtonGroup>
            {connected ? (
              <>
                <Button
                  color="red"
                  appearance="primary"
                  startIcon={<Icon name="pause" />}
                  onClick={disconnect}
                >
                  {translation.stop_capture}
                </Button>
                <Button
                  color="blue"
                  appearance="primary"
                  startIcon={<Icon name="camera" />}
                  onClick={async () => {
                    disconnect();

                    const lastImage = lastMsg?.payload?.imageBase64;

                    if (!lastImage) return;
                    const tokenImage = await generateTokenImage(lastImage);

                    if (!tokenImage) return;

                    forceCapture({ ...tokenImage, imageBase64: lastImage });
                  }}
                  disabled={
                    !lastMsg ||
                    lastMsg.type !== "frame" ||
                    !lastMsg.payload?.imageBase64
                  }
                >
                  {translation.force_capture || "Force Capture"}
                </Button>
              </>
            ) : (
              <Button
                color="green"
                appearance="primary"
                startIcon={<Icon name="play_arrow" />}
                onClick={start}
                disabled={!deviceId || !selectedFormat}
              >
                {translation.start_capture}
              </Button>
            )}
          </ButtonGroup>
        </Stack.Item>
      </Stack>
      <br />

      <PanelGroup accordion bordered>
        {/* Basic Settings Panel */}
        <Panel
          header={
            <Stack spacing={8}>
              <Gear />
              <span>Basic Settings</span>
            </Stack>
          }
          eventKey="1"
          bordered
        >
          <div>
            <Grid fluid>
              <Row gutter={16}>
                {/* Stream Format */}
                <Col xs={24} md={12} lg={8}>
                  <Form.Group>
                    <Form.ControlLabel>Stream/Image Format</Form.ControlLabel>
                    <SelectPicker
                      data={formatOptions}
                      value={selectedFormat?.label}
                      onChange={(value) => {
                        const fmt = selectedDevice?.formats.find(
                          (f) => f.label === value
                        );
                        setSelectedFormat(fmt);
                      }}
                      placeholder={translation.select}
                      // disabled={!isSuperAdmin}
                      style={{
                        width: "100%",
                        border: "1px solid var(--rs-gray-300)",
                        borderRadius: 8,
                      }}
                      block
                    />
                  </Form.Group>
                </Col>

                {/* ICAO Compliance */}
                <Col xs={24} md={12} lg={8}>
                  <Form.Group>
                    <Form.ControlLabel>ICAO Compliance</Form.ControlLabel>
                    <div>
                      <Toggle
                        checked={icao}
                        onChange={(checked) => {
                          setIcao(checked);
                          if (checked) {
                            setLivenessMode("None");
                            setDetectLiveness(false);
                          }
                        }}
                        checkedChildren="Enabled"
                        unCheckedChildren="Disabled"
                        disabled={!isSuperAdmin}
                      />
                    </div>
                  </Form.Group>
                </Col>

                {/* Liveness Detection */}
                <Col xs={24} md={12} lg={8}>
                  <Form.Group>
                    <Form.ControlLabel>Liveness Detection</Form.ControlLabel>
                    <div>
                      <Toggle
                        checked={detectLiveness}
                        onChange={setDetectLiveness}
                        checkedChildren="Enabled"
                        unCheckedChildren="Disabled"
                        // disabled={icao}
                        disabled={isSuperAdmin}
                      />
                    </div>
                  </Form.Group>
                </Col>

                {/* Liveness Mode */}
                <Col xs={24} md={12} lg={8}>
                  <Form.Group>
                    <Form.ControlLabel>Liveness Mode</Form.ControlLabel>
                    <SelectPicker
                      data={livenessModeOptions}
                      value={livenessMode}
                      onChange={(value) => setLivenessMode(value as any)}
                      // disabled={icao || !detectLiveness}
                      disabled
                      style={{ width: "100%" }}
                    />
                  </Form.Group>
                </Col>

                {/* Frame Interval */}
                <Col xs={24} md={12} lg={8}>
                  <Form.Group>
                    <Form.ControlLabel>Frame Interval (ms)</Form.ControlLabel>
                    <InputNumber
                      value={interval}
                      onChange={(value) => setIntervalMs(value || 50)}
                      min={50}
                      step={10}
                      style={{ width: "100%" }}
                      disabled={!isSuperAdmin}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Grid>
          </div>
        </Panel>

        {/* Advanced Settings Panel */}
        <Panel
          header={
            <Stack spacing={8}>
              <Gear />
              <span>Advanced Settings</span>
            </Stack>
          }
          eventKey="2"
          bordered
        >
          <div className="rs-modal-body">
            <Grid fluid>
              <Row gutter={16}>
                {/* Token Image & Template */}
                <Col xs={24} md={12} lg={8}>
                  <Panel
                    header="Token Image & Template"
                    bordered
                    className="mb-3"
                  >
                    <Form layout="vertical">
                      <Form.Group>
                        <Form.ControlLabel>Token Image Width</Form.ControlLabel>
                        <InputNumber
                          value={tokenImageWidth}
                          onChange={(value) =>
                            setTokenImageWidth(
                              value || DEFAULT_THRESHOLDS.tokenImageWidth
                            )
                          }
                          min={120}
                          max={1024}
                          step={10}
                          style={{ width: "100%" }}
                          disabled={!isSuperAdmin}
                        />
                      </Form.Group>

                      <Form.Group>
                        <Form.ControlLabel>
                          Token Quality Threshold
                        </Form.ControlLabel>
                        <InputNumber
                          value={tokenQualityThreshold}
                          onChange={(value) =>
                            setTokenQualityThreshold(
                              value || DEFAULT_THRESHOLDS.tokenQualityThreshold
                            )
                          }
                          min={0}
                          max={100}
                          style={{ width: "100%" }}
                          disabled={!isSuperAdmin}
                        />
                      </Form.Group>

                      <Form.Group>
                        <Checkbox
                          checked={createTemplate}
                          onChange={(_, checked) => setCreateTemplate(checked)}
                        >
                          Create Template
                        </Checkbox>
                      </Form.Group>

                      {createTemplate && (
                        <Form.Group>
                          <Form.ControlLabel>Template Size</Form.ControlLabel>
                          <SelectPicker
                            data={templateSizeOptions}
                            value={templateSize}
                            onChange={(value) => setTemplateSize(value as any)}
                            style={{ width: "100%" }}
                            disabled={!isSuperAdmin}
                          />
                        </Form.Group>
                      )}
                    </Form>
                  </Panel>
                </Col>

                {/* Position Settings */}
                <Col xs={24} md={12} lg={8}>
                  <Panel header="Position Settings" bordered className="mb-3">
                    <Form layout="vertical">
                      <Form.Group>
                        <Form.ControlLabel>
                          Min Inter-Ocular Distance
                        </Form.ControlLabel>
                        <InputNumber
                          value={minInterOcularDistance}
                          onChange={(value) =>
                            setMinInterOcularDistance(value || 32)
                          }
                          min={10}
                          max={200}
                          step={5}
                          style={{ width: "100%" }}
                          disabled={!isSuperAdmin}
                        />
                      </Form.Group>

                      <Form.Group>
                        <Form.ControlLabel>
                          Max Roll Angle (°)
                        </Form.ControlLabel>
                        <InputNumber
                          value={maxRoll}
                          onChange={(value) =>
                            setMaxRoll(value || DEFAULT_THRESHOLDS.maxRoll)
                          }
                          min={15}
                          max={180}
                          step={15}
                          style={{ width: "100%" }}
                          disabled={!isSuperAdmin}
                        />
                      </Form.Group>

                      <Form.Group>
                        <Form.ControlLabel>Max Yaw Angle (°)</Form.ControlLabel>
                        <InputNumber
                          value={maxYaw}
                          onChange={(value) =>
                            setMaxYaw(value || DEFAULT_THRESHOLDS.maxYaw)
                          }
                          min={15}
                          max={90}
                          step={15}
                          style={{ width: "100%" }}
                          disabled={!isSuperAdmin}
                        />
                      </Form.Group>

                      <Form.Group>
                        <Form.ControlLabel>
                          Max Pitch Angle (°)
                        </Form.ControlLabel>
                        <InputNumber
                          value={maxPitch}
                          onChange={(value) =>
                            setMaxPitch(value || DEFAULT_THRESHOLDS.maxPitch)
                          }
                          min={15}
                          max={90}
                          style={{ width: "100%" }}
                          disabled={!isSuperAdmin}
                        />
                      </Form.Group>
                    </Form>
                  </Panel>
                </Col>

                {/* Quality Settings */}
                <Col xs={24} md={12} lg={8}>
                  <Panel header="Quality Settings" bordered className="mb-3">
                    <Form layout="vertical">
                      <Form.Group>
                        <Form.ControlLabel>
                          Face Detection Confidence
                        </Form.ControlLabel>
                        <InputNumber
                          value={faceConfidence}
                          onChange={(value) =>
                            setFaceConfidence(
                              value || DEFAULT_THRESHOLDS.faceConfidence
                            )
                          }
                          min={0}
                          max={100}
                          style={{ width: "100%" }}
                          disabled={!isSuperAdmin}
                        />
                      </Form.Group>

                      <Form.Group>
                        <Form.ControlLabel>
                          Face Quality Threshold
                        </Form.ControlLabel>
                        <InputNumber
                          value={qualityThreshold}
                          onChange={(value) =>
                            setQualityThreshold(
                              value || DEFAULT_THRESHOLDS.quality
                            )
                          }
                          min={0}
                          max={100}
                          style={{ width: "100%" }}
                          disabled={!isSuperAdmin}
                        />
                      </Form.Group>

                      <Form.Group>
                        <Form.ControlLabel>
                          Additional Faces Threshold
                        </Form.ControlLabel>
                        <InputNumber
                          value={additionalFacesThreshold}
                          onChange={(value) =>
                            setAdditionalFacesThreshold(
                              value ||
                                DEFAULT_THRESHOLDS.additionalFacesThreshold
                            )
                          }
                          min={0}
                          max={100}
                          style={{ width: "100%" }}
                          disabled={!isSuperAdmin}
                        />
                      </Form.Group>
                    </Form>
                    <Form>
                      <Form.Group>
                        <Form.ControlLabel>
                          Clear Face Visibility Threshold
                        </Form.ControlLabel>
                        <InputNumber
                          value={clearFaceVisibilityThreshold}
                          onChange={(value) =>
                            setClearFaceVisibilityThreshold(value || 80)
                          }
                          min={0}
                          max={100}
                          style={{ width: "100%" }}
                          disabled={!isSuperAdmin}
                        />
                      </Form.Group>

                      <Form.Group>
                        <Form.ControlLabel>
                          White Background Threshold
                        </Form.ControlLabel>
                        <InputNumber
                          value={whiteBackgroundThreshold}
                          onChange={(value) =>
                            setWhiteBackgroundThreshold(value || 70)
                          }
                          min={0}
                          max={100}
                          style={{ width: "100%" }}
                          disabled={!isSuperAdmin}
                        />
                      </Form.Group>

                      <Form.Group>
                        <Form.ControlLabel>
                          Eyes Open Threshold
                        </Form.ControlLabel>
                        <InputNumber
                          value={eyesOpenThreshold}
                          onChange={(value) =>
                            setEyesOpenThreshold(value || 80)
                          }
                          min={0}
                          max={100}
                          style={{ width: "100%" }}
                          disabled={!isSuperAdmin}
                        />
                      </Form.Group>
                    </Form>
                  </Panel>
                </Col>

                {/* Liveness Settings */}
                <Col xs={24} md={12} lg={8}>
                  <Panel
                    header="Liveness Settings"
                    bordered
                    className="mb-3"
                    // style={{ display: icao ? "none" : "block" }}
                  >
                    <Form layout="vertical">
                      <Form.Group>
                        <Form.ControlLabel>
                          Liveness Threshold
                        </Form.ControlLabel>
                        <InputNumber
                          value={livenessThreshold}
                          onChange={(value) =>
                            setLivenessThreshold(
                              value || DEFAULT_THRESHOLDS.livenessThreshold
                            )
                          }
                          min={0}
                          max={100}
                          style={{ width: "100%" }}
                          disabled={!isSuperAdmin}
                        />
                      </Form.Group>

                      <Form.Group>
                        <Form.ControlLabel>
                          Liveness Confidence Threshold
                        </Form.ControlLabel>
                        <InputNumber
                          value={livenessConfidenceThreshold}
                          onChange={(value) =>
                            setLivenessConfidenceThreshold(
                              value ||
                                DEFAULT_THRESHOLDS.livenessConfidenceThreshold
                            )
                          }
                          min={0}
                          max={100}
                          style={{ width: "100%" }}
                          disabled={!isSuperAdmin}
                        />
                      </Form.Group>
                    </Form>
                  </Panel>
                </Col>

                {/* Detection Settings */}
                <Col xs={24} md={12} lg={8}>
                  <Panel header="Detection Settings" bordered className="mb-3">
                    <Form layout="vertical">
                      <CheckboxGroup
                        value={[
                          ...(detectAllFeaturePoints ? ["featurePoints"] : []),
                          ...(determineGender ? ["gender"] : []),
                          ...(determineAge ? ["age"] : []),
                          ...(detectProperties ? ["properties"] : []),
                        ]}
                        onChange={(value) => {
                          setDetectAllFeaturePoints(
                            value.includes("featurePoints")
                          );
                          setDetermineGender(value.includes("gender"));
                          setDetermineAge(value.includes("age"));
                          setDetectProperties(value.includes("properties"));
                        }}
                        disabled={!isSuperAdmin}
                      >
                        <Checkbox value="featurePoints">
                          Detect All Feature Points
                        </Checkbox>
                        <Checkbox value="gender">Determine Gender</Checkbox>
                        <Checkbox value="age">Determine Age</Checkbox>
                        <Checkbox value="properties">
                          Detect Base Facial Attributes
                        </Checkbox>
                      </CheckboxGroup>
                    </Form>
                  </Panel>
                </Col>

                {/* Output Settings */}
                <Col xs={24} md={12} lg={8}>
                  <Panel header="Output Settings" bordered className="mb-3">
                    <Form layout="vertical">
                      <Checkbox
                        checked={removeRedEyes}
                        onChange={(_, checked) => setRemoveRedEyes(checked)}
                        disabled
                      >
                        Remove Red Eyes
                      </Checkbox>
                      <Checkbox
                        checked={removeBackground}
                        onChange={(_, checked) => setRemoveBackground(checked)}
                        disabled
                      >
                        Remove Background
                      </Checkbox>
                      <Checkbox
                        checked={createThumbnail}
                        onChange={(_, checked) => setCreateThumbnail(checked)}
                        disabled
                      >
                        Create Image Thumbnail
                      </Checkbox>

                      {createThumbnail && (
                        <Form.Group>
                          <Form.ControlLabel>Thumbnail Width</Form.ControlLabel>
                          <InputNumber
                            value={thumbnailWidth}
                            onChange={(value) =>
                              setThumbnailWidth(
                                value || DEFAULT_THRESHOLDS.thumbnailWidth
                              )
                            }
                            min={32}
                            max={512}
                            step={16}
                            style={{ width: "100%" }}
                            disabled
                          />
                        </Form.Group>
                      )}
                    </Form>
                  </Panel>
                </Col>
              </Row>
            </Grid>
          </div>
        </Panel>
      </PanelGroup>
    </>
  );
}
