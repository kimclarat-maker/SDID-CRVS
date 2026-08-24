import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import Modal from "@/components/Modal";
import Button from "@/components/button";

type ScanState = "IDLE" | "REQUESTING" | "SCANNING" | "UNAVAILABLE";

/** QR-scanner modal (spec §31): the camera is never started before an
 * explicit "Start camera" click, and manual entry is always offered as a
 * fallback. Decoded text is expected to be a verify URL/token, not sensitive
 * data — this modal only ever hands the raw decoded string back to the
 * caller, it doesn't interpret it. */
export default function QrScannerModal({
  show,
  onClose,
  onDecoded,
  testId = "qr-scanner-modal",
}: {
  show: boolean;
  onClose: () => void;
  onDecoded: (value: string) => void;
  testId?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader>();
  const [state, setState] = useState<ScanState>("IDLE");
  const [error, setError] = useState<string | undefined>();
  const [manualValue, setManualValue] = useState("");
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    if (!show) {
      controlsRef.current?.stop();
      controlsRef.current = null;
      setState("IDLE");
      setError(undefined);
      setShowManual(false);
      setManualValue("");
    }
    return () => {
      controlsRef.current?.stop();
    };
  }, [show]);

  const handleStart = async () => {
    setState("REQUESTING");
    setError(undefined);
    try {
      if (!codeReaderRef.current) codeReaderRef.current = new BrowserQRCodeReader();
      const devices = await BrowserQRCodeReader.listVideoInputDevices();
      if (devices.length === 0 || !videoRef.current) {
        setState("UNAVAILABLE");
        setError("No camera is available on this device.");
        return;
      }
      setState("SCANNING");
      const controls = await codeReaderRef.current.decodeFromVideoDevice(
        devices[0].deviceId,
        videoRef.current,
        (result, err, controls) => {
          if (result) {
            onDecoded(result.getText());
            controls.stop();
            onClose();
          }
          if (err && err.name !== "NotFoundException") {
            setError("The scanned code couldn't be read. Try again or enter it manually.");
          }
        }
      );
      controlsRef.current = controls;
    } catch (err) {
      setState("UNAVAILABLE");
      setError(err instanceof Error ? err.message : "Camera access was denied or is unavailable.");
    }
  };

  const handleStop = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setState("IDLE");
  };

  return (
    <Modal show={show} handleClose={onClose} title="Scan certificate QR code" size="sm" testId={testId}>
      <div className="modal-body" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {state === "IDLE" && (
          <>
            <p className="crvs-form-hint">
              We'll ask your browser for camera access to scan the QR code printed on the certificate. Nothing is
              recorded except the scanned code.
            </p>
            <Button text="Start camera" appearance="primary" onClick={handleStart} testId={`${testId}-start`} />
          </>
        )}
        {state === "REQUESTING" && <p className="crvs-form-hint">Requesting camera access…</p>}
        {state === "SCANNING" && (
          <>
            <video ref={videoRef} style={{ width: "100%", borderRadius: 8 }} />
            <Button text="Stop camera" appearance="ghost" onClick={handleStop} testId={`${testId}-stop`} />
          </>
        )}
        {state === "UNAVAILABLE" && (
          <p className="crvs-banner crvs-banner-danger" role="alert">
            {error || "Camera unavailable."}
          </p>
        )}
        {error && state === "SCANNING" && (
          <p className="crvs-form-error" role="alert">
            {error}
          </p>
        )}

        <div>
          <button type="button" className="crvs-tab" onClick={() => setShowManual((v) => !v)} data-testid={`${testId}-manual-toggle`}>
            Enter code manually instead
          </button>
          {showManual && (
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <input
                value={manualValue}
                onChange={(e) => setManualValue(e.target.value)}
                placeholder="Certificate number or verification token"
                data-testid={`${testId}-manual-input`}
                style={{ flex: 1 }}
              />
              <Button
                text="Use"
                appearance="primary"
                disabled={!manualValue.trim()}
                onClick={() => {
                  onDecoded(manualValue.trim());
                  onClose();
                }}
                testId={`${testId}-manual-submit`}
              />
            </div>
          )}
        </div>
      </div>
      <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", padding: 16 }}>
        <Button text="Close" appearance="ghost" onClick={onClose} testId={`${testId}-close`} />
      </div>
    </Modal>
  );
}
