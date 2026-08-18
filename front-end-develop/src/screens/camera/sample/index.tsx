import React, { useState } from "react";
import {
  Button,
  Toggle,
  InputNumber,
  Panel,
  Message,
  Loader,
  Divider,
  Tooltip,
  Whisper,
  ButtonToolbar,
} from "rsuite";
import {
  useExact4KCamera,
  BIOMETRIC_RECOMMENDATIONS,
} from "@/hooks/useExact4KCamera";
import AppLayout from "@/layout";

export default function CameraSDKSampleApp() {
  const [mirrorPreview, setMirrorPreview] = useState(false);
  const [frameRate, setFrameRate] = useState(30);
  const [lastBase64, setLastBase64] = useState<string | null>(null);
  const [lastPassport, setLastPassport] = useState<string | null>(null);

  const {
    mountRef,
    status,
    start,
    stop,
    download,
    captureBase64,
    capturePassportBase64,
    tuneForBiometric,
  } = useExact4KCamera({
    mirrorPreview,
    frameRate,
    previewWidth: "512px", // intrinsic capture remains 3840x2160
  });

  const isReady = status.kind === "ready";
  const isStarting = status.kind === "starting";

  return (
    <AppLayout navbarContainerType="container">
      <div
        className="container py-4"
        style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}
      >
        <div className="row mb-3 align-items-center">
          <div className="col">
            <h1 className="h4 mb-0">4K Camera Capture (3840x2160)</h1>
            <small className="text-muted">Biometric capture helpers</small>
          </div>
          <div className="col-auto">
            {isStarting && <Loader content="Requesting camera…" />}
          </div>
        </div>

        <Panel bordered header="Controls" className="mb-3">
          <div className="row g-3">
            <div className="col-12 col-md-3 d-flex align-items-center gap-2">
              <label className="me-2 small">Frame rate</label>
              <InputNumber
                value={frameRate}
                min={1}
                max={60}
                onChange={(v) => setFrameRate(Number(v) || 30)}
                style={{ width: 120 }}
              />
              <span className="text-muted small">fps</span>
            </div>

            <div className="col-12 col-md-3 d-flex align-items-center gap-2">
              <Toggle
                checked={mirrorPreview}
                onChange={setMirrorPreview}
                checkedChildren="Mirror"
                unCheckedChildren="Mirror"
              />
              <span className="small">Mirror preview</span>
            </div>

            <div className="col-12 col-md-6">
              <ButtonToolbar>
                {!isReady ? (
                  <Button appearance="primary" onClick={start}>
                    Start 4K
                  </Button>
                ) : (
                  <Button appearance="ghost" onClick={stop}>
                    Stop
                  </Button>
                )}
                <Button
                  appearance="primary"
                  disabled={!isReady}
                  onClick={() =>
                    download(
                      "still-4k.jpg",
                      BIOMETRIC_RECOMMENDATIONS.format,
                      BIOMETRIC_RECOMMENDATIONS.quality
                    )
                  }
                >
                  Capture JPEG
                </Button>
                <Button
                  appearance="primary"
                  disabled={!isReady}
                  onClick={async () =>
                    setLastBase64(
                      await captureBase64(
                        BIOMETRIC_RECOMMENDATIONS.format,
                        BIOMETRIC_RECOMMENDATIONS.quality
                      )
                    )
                  }
                >
                  Capture Base64
                </Button>
                <Button
                  appearance="primary"
                  disabled={!isReady}
                  onClick={async () =>
                    setLastPassport(
                      await capturePassportBase64(
                        BIOMETRIC_RECOMMENDATIONS.format,
                        BIOMETRIC_RECOMMENDATIONS.quality
                      )
                    )
                  }
                >
                  Capture Passport photo 3:4
                </Button>
                <Whisper
                  placement="top"
                  trigger="hover"
                  speaker={
                    <Tooltip>Best-effort AF/AWB/AE + modest zoom</Tooltip>
                  }
                >
                  <Button
                    appearance="default"
                    disabled={!isReady}
                    onClick={async () => {
                      const r = await tuneForBiometric({ zoomLevel: "low" });
                      console.log("Biometric tune applied", r);
                    }}
                  >
                    Optimize Biometric
                  </Button>
                </Whisper>
              </ButtonToolbar>
            </div>
          </div>
        </Panel>

        <div className="mb-3">
          {status.kind === "idle" && (
            <Message type="info" showIcon>
              Idle. Click <b>Start 4K</b> to request the camera (HTTPS or
              localhost required).
            </Message>
          )}
          {status.kind === "starting" && (
            <Message type="warning" showIcon>
              Grant camera permission in the browser. Trying exact 3840x2160...
            </Message>
          )}
          {status.kind === "ready" && (
            <Message type="success" showIcon>
              Ready at{" "}
              <b>
                {status.width}x{status.height}
              </b>
              . Recommended: mirror=false, JPEG @ 0.92.
            </Message>
          )}
          {status.kind === "error" && (
            <Message type="error" showIcon>
              Error: {status.message}
            </Message>
          )}
        </div>

        {/* Preview mount (small window). Capture stills remain full 4K. */}
        <Panel bordered header="Preview" className="mb-3">
          <div ref={mountRef} />
          <div>
            Preview element is small; intrinsic capture remains 3840x2160.
          </div>
        </Panel>

        {(lastBase64 || lastPassport) && (
          <Panel bordered header="Last Captures" className="mb-4">
            <div className="row g-3">
              {lastBase64 && (
                <div className="col-12 col-md-6">
                  <h6 className="mb-2">Full 4K (Base64)</h6>
                  <img
                    src={lastBase64}
                    alt="last capture"
                    className="img-thumbnail mb-2"
                    style={{ maxWidth: 320 }}
                  />
                  <textarea
                    className="form-control"
                    rows={6}
                    readOnly
                    value={lastBase64}
                  />
                </div>
              )}
              {lastPassport && (
                <div className="col-12 col-md-6">
                  <h6 className="mb-2">Passport 3:4 (Base64)</h6>
                  <img
                    src={lastPassport}
                    alt="passport capture"
                    className="img-thumbnail mb-2"
                    style={{ maxWidth: 320 }}
                  />
                  <textarea
                    className="form-control"
                    rows={6}
                    readOnly
                    value={lastPassport}
                  />
                </div>
              )}
            </div>
            <Divider />
            <Button
              appearance="ghost"
              onClick={() => {
                setLastBase64(null);
                setLastPassport(null);
              }}
            >
              Clear
            </Button>
          </Panel>
        )}

        <Panel bordered header="Biometric Recommendations" className="mb-3">
          <ul className="mb-0 small">
            <li>
              Mirror preview: <b>false</b>; Frame rate:{" "}
              <b>{BIOMETRIC_RECOMMENDATIONS.frameRate} fps</b>; JPEG quality:{" "}
              <b>{BIOMETRIC_RECOMMENDATIONS.quality}</b>
            </li>
            <li>
              Even front lighting, plain light background, subject 0.5-1 m from
              backdrop.
            </li>
            <li>
              Portrait crop 3:4; head fills ~60-70% height; eyes at ~60% of
              image height.
            </li>
            <li>
              Use modest zoom to reduce wide-angle distortion; keep lens at eye
              level.
            </li>
          </ul>
        </Panel>

        <div className="text-muted small">
          Tip: If exact 4K fails, ensure your webcam supports 3840x2160, use USB
          3.0+, and close other camera apps.
        </div>
      </div>
    </AppLayout>
  );
}
