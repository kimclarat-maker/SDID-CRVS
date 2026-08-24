import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import Notice from "@/components/public/Notice";
import DemoBadge from "@/components/demoBadge";
import {
  demoGetCertificateRequest,
  demoSimulatePaymentFailure,
  demoSimulatePaymentSuccess,
} from "@/demo/services/crvsCertificates";
import { BirthCertificateRequest } from "@/domain/crvs/types";

const PUBLIC_ACTOR_NAME = "Public requester";

type PaymentUiState = "IDLE" | "PROCESSING" | "SUCCESS" | "FAILED";

/** Demo payment simulation page (spec §21). No real card/bank/mobile-money
 * details are ever collected — this page only ever calls the two demo
 * service functions that flip payment status. */
export default function BirthCertificatePayment() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<BirthCertificateRequest | undefined>();
  const [loading, setLoading] = useState(true);
  const [uiState, setUiState] = useState<PaymentUiState>("IDLE");
  const [failureReason, setFailureReason] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      if (!requestId) return;
      const found = await demoGetCertificateRequest(requestId);
      setRequest(found);
      setLoading(false);
    })();
  }, [requestId]);

  if (loading) {
    return (
      <Section>
        <Notice type="info" title="Loading">
          Loading your request…
        </Notice>
      </Section>
    );
  }

  if (!request) {
    return (
      <>
        <PageHeader title="Request not found" eyebrow="Certificates" />
        <Section>
          <Notice type="warning" title="We couldn't find this request">
            Check the link, or track your request from the home page.
          </Notice>
        </Section>
      </>
    );
  }

  if (request.payment.status === "PAID" || request.payment.status === "WAIVED") {
    return (
      <>
        <PageHeader title="Payment already completed" eyebrow="Certificates" />
        <Section>
          <Notice type="success" title="Paid">
            This request's payment has already been completed.
          </Notice>
          <button
            type="button"
            className="public-btn public-btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => navigate(`/track`)}
            data-testid="payment-go-track"
          >
            Track this request
          </button>
        </Section>
      </>
    );
  }

  const handleSuccess = async () => {
    setUiState("PROCESSING");
    await new Promise((r) => window.setTimeout(r, 900));
    try {
      const updated = demoSimulatePaymentSuccess(request.id, PUBLIC_ACTOR_NAME);
      setRequest(updated);
      setUiState("SUCCESS");
    } catch (err) {
      setFailureReason(err instanceof Error ? err.message : "Payment could not be processed.");
      setUiState("FAILED");
    }
  };

  const handleFailure = async () => {
    setUiState("PROCESSING");
    await new Promise((r) => window.setTimeout(r, 900));
    const updated = demoSimulatePaymentFailure(request.id, PUBLIC_ACTOR_NAME);
    setRequest(updated);
    setFailureReason(updated.payment.failureReason);
    setUiState("FAILED");
  };

  return (
    <>
      <PageHeader
        title="Complete demo payment"
        description={`Application reference: ${request.applicationReference}`}
        eyebrow="Certificates"
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Birth certificate", href: "/certificates/birth" },
          { label: "Payment" },
        ]}
      />
      <Section>
        <p style={{ marginBottom: "0.75rem" }}>
          <DemoBadge /> No real payment provider is called. No real card, bank, or mobile-money details are collected.
        </p>

        <dl className="public-fact-list" style={{ marginBottom: "1.5rem" }}>
          <div>
            <dt>Billing reference</dt>
            <dd>{request.payment.billingReference || "—"}</dd>
          </div>
          <div>
            <dt>Fee</dt>
            <dd>
              {request.payment.currency} {request.payment.amount.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{request.payment.status.replace(/_/g, " ")}</dd>
          </div>
        </dl>

        {uiState === "IDLE" && (
          <>
            <div className="public-grid public-grid-3" style={{ marginBottom: "1.5rem" }}>
              {["Demo card", "Demo mobile money", "Demo bank transfer"].map((method) => (
                <div className="public-card" key={method}>
                  <h3>{method}</h3>
                  <p>Fictional payment method for demonstration only.</p>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button type="button" className="public-btn public-btn-primary" onClick={handleSuccess} data-testid="simulate-payment-success">
                Simulate successful payment
              </button>
              <button type="button" className="public-btn public-btn-outline" onClick={handleFailure} data-testid="simulate-payment-failure">
                Simulate failed payment
              </button>
            </div>
          </>
        )}

        {uiState === "PROCESSING" && (
          <Notice type="info" title="Processing payment">
            Please wait — do not resubmit.
          </Notice>
        )}

        {uiState === "SUCCESS" && (
          <>
            <Notice type="success" title="Payment received">
              Receipt reference: {request.payment.receiptReference} · Paid {request.payment.paidAt ? new Date(request.payment.paidAt).toLocaleString() : ""}
            </Notice>
            <p style={{ marginTop: 12 }}>
              Next step: {request.status === "APPROVED" || request.status === "ISSUING" || request.status === "ISSUED"
                ? "your certificate is being issued."
                : "your request is now eligible for review or automatic issuance."}
            </p>
            <button
              type="button"
              className="public-btn public-btn-primary"
              style={{ marginTop: 12 }}
              onClick={() => navigate(`/certificates/birth/request/${request.id}/success`)}
              data-testid="payment-continue"
            >
              Continue
            </button>
          </>
        )}

        {uiState === "FAILED" && (
          <>
            <Notice type="danger" title="Payment failed">
              {failureReason || "The demo payment simulator returned a declined transaction."}
            </Notice>
            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              <button type="button" className="public-btn public-btn-primary" onClick={() => setUiState("IDLE")} data-testid="payment-retry">
                Retry
              </button>
              <button type="button" className="public-btn public-btn-outline" onClick={() => navigate(`/certificates/birth/request/${request.id}`)} data-testid="payment-return">
                Return to request
              </button>
            </div>
          </>
        )}
      </Section>
    </>
  );
}
