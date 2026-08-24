import { useLocation, useNavigate } from "react-router-dom";
import CertificateRequestQueue, { CertificateQueueBucket } from "../components/CertificateRequestQueue";
import Button from "@/components/button";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import "../../shared.css";

const BUCKET_BY_PATH: { suffix: string; bucket: CertificateQueueBucket; title: string; subtitle: string }[] = [
  { suffix: "/certificates/requests", bucket: "ALL", title: "All certificate requests", subtitle: "Every birth-certificate request across both channels." },
  { suffix: "/certificates/manual-review", bucket: "MANUAL_REVIEW", title: "Manual review", subtitle: "Requests that require a Civil Registrar's decision." },
  { suffix: "/certificates/payment-pending", bucket: "PAYMENT_PENDING", title: "Awaiting payment", subtitle: "Requests with pending or failed demo payment." },
  { suffix: "/certificates/delivery-failures", bucket: "DELIVERY_FAILED", title: "Delivery failures", subtitle: "Issued certificates whose delivery attempt failed." },
];

export default function CertificateRequestsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const match =
    BUCKET_BY_PATH.find((b) => location.pathname.endsWith(b.suffix)) || BUCKET_BY_PATH[0];

  const canAssist = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_REQUEST_ASSIST);

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">{match.title}</h1>
        <p className="crvs-page-subtitle">{match.subtitle}</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-tabs" role="tablist">
        {BUCKET_BY_PATH.map((b) => (
          <button
            key={b.suffix}
            type="button"
            role="tab"
            aria-selected={b.bucket === match.bucket}
            className={`crvs-tab ${b.bucket === match.bucket ? "is-active" : ""}`}
            onClick={() => navigate(`/dashboard/crvs${b.suffix}`)}
          >
            {b.title}
          </button>
        ))}
        {canAssist && (
          <Button
            text="New assisted request"
            size="sm"
            appearance="primary"
            startIcon="add_circle"
            onClick={() => navigate("/dashboard/crvs/certificates/new")}
            testId="requests-new-assisted"
          />
        )}
      </div>

      <CertificateRequestQueue bucket={match.bucket} />
    </div>
  );
}
