import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/button";
import Empty from "@/components/empty";
import { demoGetCertificate } from "@/demo/services/crvsCertificates";
import { demoListCrvsAuditEvents } from "@/demo/services/crvsAudit";
import { DemoAuditEvent } from "@/demo/types";
import { formatDateTime } from "../../utils";
import "../../../shared.css";

export default function IssuedCertificateAudit() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const navigate = useNavigate();
  const [certificateNumber, setCertificateNumber] = useState<string | undefined>();
  const [events, setEvents] = useState<DemoAuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!certificateId) return;
      setLoading(true);
      const certificate = await demoGetCertificate(certificateId);
      if (!certificate) {
        setLoading(false);
        return;
      }
      setCertificateNumber(certificate.certificateNumber);
      const audit = await demoListCrvsAuditEvents({ targetRef: certificate.certificateNumber, limit: 200 });
      setEvents(audit.data);
      setLoading(false);
    })();
  }, [certificateId]);

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Audit history</h1>
        <p className="crvs-page-subtitle">{certificateNumber || "Certificate"}</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <Button text="Back to certificate" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/certificates/issued/${certificateId}`)} testId="audit-back" />

      <div className="crvs-section">
        {loading ? (
          <Empty icon="hourglass_empty" title="Loading audit history…" />
        ) : events.length === 0 ? (
          <Empty icon="history" title="No audit events recorded" description="Actions taken on this certificate will appear here." />
        ) : (
          <div className="review-audit-list">
            {events.map((ev) => (
              <div key={ev.id} className="review-audit-item">
                <strong>{ev.actor}</strong> {ev.action} — {formatDateTime(ev.at)}
                {ev.details && <div className="crvs-form-hint">{ev.details}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
