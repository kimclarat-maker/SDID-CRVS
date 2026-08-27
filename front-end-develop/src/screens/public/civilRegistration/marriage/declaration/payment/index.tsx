import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import Notice from "@/components/public/Notice";
import { demoGetMarriageApplication } from "@/demo/services/crvsMarriageApplications";
import { demoAttemptMarriagePayment, demoCancelMarriagePayment, DemoPaymentMethod } from "@/demo/services/crvsMarriagePayment";
import { MarriageApplication } from "@/domain/crvs/types";
import { currencyLabel } from "@/screens/dashboard/crvs/marriageShared";
import toastMessage from "@/utils/common/toastMessage";

const PUBLIC_ACTOR_NAME = "Public applicant";

const PAYMENT_METHODS: { value: DemoPaymentMethod; label: string }[] = [
  { value: "DEMO_MOBILE_MONEY", label: "Mobile money (demo)" },
  { value: "DEMO_CARD", label: "Card payment (demo)" },
  { value: "DEMO_BANK_TRANSFER", label: "Bank transfer (demo)" },
];

/**
 * Public payment page (spec §5 step 9 for marriage) — only meaningful while
 * application.payment.status is PENDING or FAILED. This is a demo payment
 * simulation only: no real payment provider is ever integrated, and the
 * copy below says so explicitly.
 */
export default function MarriageDeclarationPayment() {
  const { draftId } = useParams<{ draftId: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<MarriageApplication | undefined>();
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<DemoPaymentMethod>("DEMO_MOBILE_MONEY");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    if (!draftId) return;
    setLoading(true);
    demoGetMarriageApplication(draftId)
      .then(setApplication)
      .finally(() => setLoading(false));
  };

  useEffect(load, [draftId]);

  const handlePay = async () => {
    if (!application) return;
    setSubmitting(true);
    try {
      const { outcome, application: updated } = await demoAttemptMarriagePayment(application.id, method, PUBLIC_ACTOR_NAME);
      setApplication(updated);
      if (outcome === "SUCCESS") {
        toastMessage("success", "Payment received.");
        navigate(`/civil-registration/marriage/declaration/${updated.id}/success`);
      } else {
        toastMessage("error", "Demo payment provider declined the transaction.");
      }
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!application) return;
    try {
      const updated = demoCancelMarriagePayment(application.id, PUBLIC_ACTOR_NAME);
      setApplication(updated);
      toastMessage("success", "Payment attempt cancelled.");
      navigate(`/civil-registration/marriage/application/${updated.reference}`);
    } catch (err) {
      toastMessage("error", err);
    }
  };

  if (loading) {
    return <PageHeader title="Loading…" eyebrow="Civil registration" />;
  }

  if (!application) {
    return (
      <>
        <PageHeader title="Declaration not found" eyebrow="Civil registration" />
        <Section>
          <Notice type="warning" title="We couldn't find this declaration">
            Check your saved reference, or start a new declaration.
          </Notice>
        </Section>
      </>
    );
  }

  const payment = application.payment;
  const payable = payment.status === "PENDING" || payment.status === "FAILED";

  if (!payable) {
    return (
      <>
        <PageHeader title="Payment" description={application.reference} eyebrow="Civil registration" />
        <Section>
          <Notice type="info" title={`No payment action needed — status is ${payment.status.replace(/_/g, " ").toLowerCase()}`}>
            {payment.status === "PAID" && "This application's fee has already been paid."}
            {payment.status === "WAIVED" && "This application's fee has been waived by a supervisor."}
            {payment.status === "NOT_REQUIRED" && "No fee is currently due for this application."}
            {payment.status === "CANCELLED" && "A previous payment attempt was cancelled. Track your application for the latest status."}
          </Notice>
          <div className="public-hero-actions" style={{ marginTop: "1.5rem" }}>
            <button
              type="button"
              className="public-btn public-btn-primary"
              onClick={() => navigate(`/civil-registration/marriage/application/${application.reference}`)}
              data-testid="marriage-payment-track"
            >
              Track application
            </button>
          </div>
        </Section>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Pay your marriage-declaration fee" description={application.reference} eyebrow="Civil registration" />
      <Section>
        <Notice type="info" title="Demo payment — no real transaction occurs">
          This is a simulated payment for demonstration purposes only. No money moves and no real payment provider is
          contacted.
        </Notice>

        <dl className="public-fact-list" style={{ marginTop: "1.5rem" }}>
          <div>
            <dt>Amount due</dt>
            <dd>{currencyLabel(payment.amount, payment.currency)}</dd>
          </div>
          {payment.isSpecialDayFee && (
            <div>
              <dt>Includes special-day surcharge</dt>
              <dd>Yes</dd>
            </div>
          )}
          {payment.status === "FAILED" && (
            <div>
              <dt>Last attempt</dt>
              <dd>Declined by the demo payment provider</dd>
            </div>
          )}
        </dl>

        {payment.status === "FAILED" && (
          <Notice type="danger" title="Your last payment attempt failed">
            The demo payment provider declined the transaction. You can retry with the same or a different method, or
            cancel and return to tracking.
          </Notice>
        )}

        <div style={{ marginTop: "1.5rem" }}>
          <h3>Choose a payment method</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {PAYMENT_METHODS.map((m) => (
              <label key={m.value} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="radio"
                  name="payment-method"
                  value={m.value}
                  checked={method === m.value}
                  onChange={() => setMethod(m.value)}
                  data-testid={`marriage-payment-method-${m.value}`}
                />
                {m.label}
              </label>
            ))}
          </div>
        </div>

        <div className="public-hero-actions" style={{ marginTop: "1.5rem" }}>
          <button type="button" className="public-btn public-btn-primary" onClick={handlePay} disabled={submitting} data-testid="marriage-payment-pay">
            {submitting ? "Processing payment…" : payment.status === "FAILED" ? "Retry payment" : "Pay now"}
          </button>
          <button type="button" className="public-btn public-btn-outline" onClick={handleCancel} disabled={submitting} data-testid="marriage-payment-cancel">
            Cancel
          </button>
        </div>
      </Section>
    </>
  );
}
