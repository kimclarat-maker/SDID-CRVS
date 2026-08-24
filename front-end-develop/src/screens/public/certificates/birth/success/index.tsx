import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import Notice from "@/components/public/Notice";
import { demoGetCertificateRequest } from "@/demo/services/crvsCertificates";
import { BirthCertificateRequest } from "@/domain/crvs/types";

export default function BirthCertificateRequestSuccess() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<BirthCertificateRequest | undefined>();
  const [loading, setLoading] = useState(true);

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

  return (
    <>
      <PageHeader title="Request submitted" eyebrow="Certificates" />
      <Section>
        <Notice type="success" title="Your request has been submitted">
          Keep your application reference — you'll need it to track your request.
        </Notice>

        <dl className="public-fact-list" style={{ marginTop: "1.5rem" }}>
          <div>
            <dt>Application reference</dt>
            <dd>{request.applicationReference}</dd>
          </div>
          <div>
            <dt>Current status</dt>
            <dd>{request.status.replace(/_/g, " ")}</dd>
          </div>
          {request.payment.billingReference && (
            <div>
              <dt>Billing reference</dt>
              <dd>{request.payment.billingReference}</dd>
            </div>
          )}
        </dl>

        <div className="public-hero-actions" style={{ marginTop: "1.5rem" }}>
          <button type="button" className="public-btn public-btn-primary" onClick={() => navigate("/track")} data-testid="success-track">
            Track request
          </button>
          {request.payment.status === "PENDING" && (
            <button
              type="button"
              className="public-btn public-btn-secondary"
              onClick={() => navigate(`/certificates/birth/request/${request.id}/payment`)}
              data-testid="success-continue-payment"
            >
              Continue to payment
            </button>
          )}
          <button type="button" className="public-btn public-btn-outline" onClick={() => navigate("/")} data-testid="success-home">
            Return home
          </button>
        </div>
      </Section>
    </>
  );
}
