import { useState } from "react";
import Button from "@/components/button";
import { demoDelay } from "@/demo/config";
import "./styles.css";

export type DemoBiometricKind =
  | "selfie"
  | "fingerprint"
  | "iris"
  | "signature";

export type DemoBiometricOutcome = "captured" | "poorQuality" | "deviceError";

type Props = {
  kind: DemoBiometricKind;
  onComplete: (outcome: DemoBiometricOutcome) => void;
};

const LABELS: Record<DemoBiometricKind, string> = {
  selfie: "Selfie capture",
  fingerprint: "Fingerprint capture",
  iris: "Iris capture",
  signature: "Signature capture",
};

// Demo-mode stand-in for real biometric hardware capture. Never touches a
// camera, fingerprint reader, iris scanner or signature pad, and never sends
// anything to a production biometric service — see spec section 17.
export default function DemoBiometricSimulator({ kind, onComplete }: Props) {
  const [status, setStatus] = useState<
    "idle" | "capturing" | DemoBiometricOutcome
  >("idle");

  const simulate = async (outcome: DemoBiometricOutcome) => {
    setStatus("capturing");
    await demoDelay(null, 500);
    setStatus(outcome);
    if (outcome === "captured") onComplete(outcome);
  };

  return (
    <div className="demo-biometric-simulator">
      <div className="demo-biometric-simulator-notice">
        Demo biometric simulation — no biometric data is being captured.
      </div>
      <div className="demo-biometric-simulator-preview">
        {status === "capturing" && <span>Simulating {LABELS[kind]}…</span>}
        {status === "captured" && <span>✓ {LABELS[kind]} captured</span>}
        {status === "poorQuality" && (
          <span>⚠ Quality check failed — try again</span>
        )}
        {status === "deviceError" && <span>✕ Simulated device error</span>}
        {status === "idle" && <span>{LABELS[kind]} not started</span>}
      </div>
      <div className="demo-biometric-simulator-actions">
        <Button
          text="Simulate success"
          size="sm"
          appearance="primary"
          type="button"
          onClick={() => simulate("captured")}
        />
        <Button
          text="Simulate poor quality"
          size="sm"
          appearance="ghost"
          type="button"
          onClick={() => simulate("poorQuality")}
        />
        <Button
          text="Simulate device error"
          size="sm"
          appearance="ghost"
          color="red"
          type="button"
          onClick={() => simulate("deviceError")}
        />
        {status !== "idle" && status !== "captured" && (
          <Button
            text="Retry"
            size="sm"
            appearance="ghost"
            type="button"
            onClick={() => setStatus("idle")}
          />
        )}
      </div>
    </div>
  );
}
