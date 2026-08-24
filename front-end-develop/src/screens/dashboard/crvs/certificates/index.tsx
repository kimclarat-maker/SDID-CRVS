import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CardCount from "@/components/card/count";
import Button from "@/components/button";
import StatusBadge from "../components/StatusBadge";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import { demoListCertificateRequests } from "@/demo/services/crvsCertificates";
import { BirthCertificateRequest } from "@/domain/crvs/types";
import { formatDateTime, fullName } from "./utils";
import "../shared.css";

export default function CertificatesDashboard() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<BirthCertificateRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const canAssist = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_REQUEST_ASSIST);
  const canReview = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_REVIEW_VIEW);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await demoListCertificateRequests({ limit: 500 });
      setRequests(data);
      setLoading(false);
    })();
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const requestsToday = requests.filter((r) => r.createdAt.slice(0, 10) === today).length;
  const awaitingPayment = requests.filter((r) => r.status === "PAYMENT_PENDING" || r.status === "PAYMENT_FAILED").length;
  const manualReview = requests.filter((r) => r.status === "MANUAL_REVIEW").length;
  const readyToIssue = requests.filter((r) => r.status === "APPROVED" || r.status === "PAID").length;
  const issued = requests.filter((r) => ["ISSUED", "DELIVERY_PENDING", "DELIVERED"].includes(r.status)).length;
  const deliveryFailures = requests.filter((r) => r.status === "DELIVERY_FAILED").length;
  const revoked = requests.filter((r) => r.status === "REJECTED").length;

  const recent = [...requests].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, 8);

  const columns: QueueColumn<BirthCertificateRequest>[] = [
    { key: "ref", header: "Reference", render: (r) => r.applicationReference },
    { key: "subject", header: "Subject", render: (r) => fullName(r.subject.firstName, undefined, r.subject.lastName) },
    { key: "channel", header: "Channel", render: (r) => r.channel.replace(/_/g, " ") },
    { key: "status", header: "Status", render: (r) => <StatusBadge kind="certificateRequest" status={r.status} /> },
    { key: "updated", header: "Updated", render: (r) => formatDateTime(r.updatedAt) },
    {
      key: "action",
      header: "",
      render: (r) => (
        <Button
          text="Open"
          size="sm"
          appearance="ghost"
          onClick={() => navigate(`/dashboard/crvs/certificates/requests/${r.id}`)}
          testId={`open-request-${r.id}`}
        />
      ),
    },
  ];

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Birth certificates</h1>
        <p className="crvs-page-subtitle">Requests, payment, issuance, delivery, and verification for birth certificates.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-tile-grid">
        <CardCount name="Requests today" count={requestsToday} icon="today" color="var(--brand-primary-500)" loading={loading} onClick={() => navigate("/dashboard/crvs/certificates/requests")} />
        <CardCount name="Awaiting payment" count={awaitingPayment} icon="payments" color="var(--status-warning)" loading={loading} onClick={() => navigate("/dashboard/crvs/certificates/payment-pending")} />
        <CardCount name="Manual review" count={manualReview} icon="flag" color="var(--status-warning)" loading={loading} onClick={() => navigate("/dashboard/crvs/certificates/manual-review")} />
        <CardCount name="Ready to issue" count={readyToIssue} icon="fact_check" color="var(--status-info)" loading={loading} onClick={() => navigate("/dashboard/crvs/certificates/requests")} />
        <CardCount name="Issued" count={issued} icon="workspace_premium" color="var(--status-success)" loading={loading} onClick={() => navigate("/dashboard/crvs/certificates/issued")} />
        <CardCount name="Delivery failures" count={deliveryFailures} icon="report" color="var(--status-danger)" loading={loading} onClick={() => navigate("/dashboard/crvs/certificates/delivery-failures")} />
        <CardCount name="Rejected" count={revoked} icon="cancel" color="var(--status-danger)" loading={loading} onClick={() => navigate("/dashboard/crvs/certificates/requests")} />
      </div>

      <div className="crvs-filter-bar">
        {canAssist && (
          <Button text="New assisted request" appearance="primary" startIcon="add_circle" onClick={() => navigate("/dashboard/crvs/certificates/new")} testId="dashboard-new-assisted" />
        )}
        <Button text="View all requests" appearance="ghost" onClick={() => navigate("/dashboard/crvs/certificates/requests")} testId="dashboard-view-all" />
        {canReview && (
          <Button text="Manual review" appearance="ghost" onClick={() => navigate("/dashboard/crvs/certificates/manual-review")} testId="dashboard-manual-review" />
        )}
        <Button text="Delivery failures" appearance="ghost" onClick={() => navigate("/dashboard/crvs/certificates/delivery-failures")} testId="dashboard-delivery-failures" />
        <Button text="Verify a certificate" appearance="ghost" onClick={() => window.open("/verify", "_blank")} testId="dashboard-verify" />
      </div>

      <div className="crvs-section">
        <h3 className="crvs-section-title">Recent certificate activity</h3>
        <CaseQueueTable
          rows={recent}
          columns={columns}
          getRowKey={(r) => r.id}
          loading={loading}
          emptyTitle="No certificate requests yet"
          emptyDescription="New public or staff-assisted requests will appear here."
          emptyIcon="workspace_premium"
        />
      </div>
    </div>
  );
}
