import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/button";
import { demoSendVerificationOtp, demoVerifyRequesterOtp } from "@/demo/services/crvsCertificates";
import { BirthCertificateRequest } from "@/domain/crvs/types";

const RESEND_SECONDS = 30;

export default function IdentityVerificationModal({
  show,
  onClose,
  request,
  actorName,
  onVerified,
  testId = "identity-verification-modal",
}: {
  show: boolean;
  onClose: () => void;
  request: BirthCertificateRequest | undefined;
  actorName: string;
  onVerified: (request: BirthCertificateRequest) => void;
  testId?: string;
}) {
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!show) {
      setSent(false);
      setCode("");
      setCountdown(0);
      setError(undefined);
    }
  }, [show]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  if (!request) return null;

  const destination = request.requester.phoneNumberMasked || request.requester.emailMasked || "your registered contact";

  const handleSend = () => {
    demoSendVerificationOtp(request.id, actorName);
    setSent(true);
    setCountdown(RESEND_SECONDS);
    setError(undefined);
  };

  const handleVerify = async () => {
    setSubmitting(true);
    setError(undefined);
    try {
      const updated = demoVerifyRequesterOtp(request.id, code, actorName);
      if (updated.requester.verificationStatus === "VERIFIED") {
        onVerified(updated);
        onClose();
      } else {
        setError("That code doesn't match. Check the code and try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} handleClose={onClose} title="Verify your identity" size="sm" testId={testId}>
      <div className="modal-body" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <p>We'll send a one-time demo verification code to {destination}.</p>
        {!sent ? (
          <Button text="Send demo verification code" appearance="primary" onClick={handleSend} testId={`${testId}-send`} />
        ) : (
          <>
            <div className="crvs-form-group">
              <label htmlFor="otp-input">Enter the code</label>
              <input
                id="otp-input"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                data-testid={`${testId}-code`}
              />
            </div>
            <p className="crvs-form-hint">Demo hint: the code is 246813.</p>
            {countdown > 0 ? (
              <p className="crvs-form-hint">Resend available in {countdown}s</p>
            ) : (
              <Button text="Resend code" appearance="ghost" onClick={handleSend} testId={`${testId}-resend`} />
            )}
            {error && (
              <p className="crvs-form-error" role="alert">
                {error}
              </p>
            )}
          </>
        )}
      </div>
      <div className="modal-footer" style={{ display: "flex", gap: 8, justifyContent: "flex-end", padding: 16 }}>
        <Button text="Cancel" appearance="ghost" onClick={onClose} testId={`${testId}-cancel`} />
        {sent && (
          <Button text="Verify" appearance="primary" loading={submitting} disabled={!code} onClick={handleVerify} testId={`${testId}-verify`} />
        )}
      </div>
    </Modal>
  );
}
