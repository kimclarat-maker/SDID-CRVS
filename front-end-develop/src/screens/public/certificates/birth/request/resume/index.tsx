import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import Notice from "@/components/public/Notice";
import CertificateRequestWizard from "@/screens/dashboard/crvs/certificates/components/CertificateRequestWizard";
import { demoGetCertificateRequest } from "@/demo/services/crvsCertificates";
import { BirthCertificateRequest } from "@/domain/crvs/types";

const PUBLIC_ACTOR_NAME = "Public requester";

/** Resumes an in-progress public request by id (spec §11's
 * /certificates/birth/request/:requestId route). */
export default function ResumeBirthCertificateRequest() {
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
            The link may have expired or the reference is incorrect. Start a new request or track an existing one.
          </Notice>
        </Section>
      </>
    );
  }

  return (
    <CertificateRequestWizard
      channel="PUBLIC_ONLINE"
      request={request}
      onRequestChange={setRequest}
      actorName={PUBLIC_ACTOR_NAME}
      onExit={() => navigate("/certificates/birth")}
      onSubmitted={(updated) => {
        if (updated.status === "PAYMENT_PENDING") {
          navigate(`/certificates/birth/request/${updated.id}/payment`);
        } else {
          navigate(`/certificates/birth/request/${updated.id}/success`);
        }
      }}
    />
  );
}
