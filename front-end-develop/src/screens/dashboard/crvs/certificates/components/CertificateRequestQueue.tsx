import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CaseQueueTable, { QueueColumn } from "../../components/CaseQueueTable";
import StatusBadge from "../../components/StatusBadge";
import Button from "@/components/button";
import { demoListCertificateRequests } from "@/demo/services/crvsCertificates";
import { BirthCertificateRequest, BirthCertificateRequestStatus } from "@/domain/crvs/types";
import { formatDateTime, fullName, maskId } from "../utils";

export type CertificateQueueBucket =
  | "ALL"
  | "DRAFT"
  | "MANUAL_REVIEW"
  | "PAYMENT_PENDING"
  | "DELIVERY_FAILED"
  | "REJECTED"
  | "CANCELLED";

const BUCKET_STATUSES: Record<CertificateQueueBucket, BirthCertificateRequestStatus[] | null> = {
  ALL: null,
  DRAFT: ["DRAFT", "IDENTITY_VERIFICATION_REQUIRED", "RECORD_LOOKUP_REQUIRED", "RECORD_NOT_FOUND"],
  MANUAL_REVIEW: ["MANUAL_REVIEW"],
  PAYMENT_PENDING: ["PAYMENT_PENDING", "PAYMENT_FAILED"],
  DELIVERY_FAILED: ["DELIVERY_FAILED"],
  REJECTED: ["REJECTED"],
  CANCELLED: ["CANCELLED"],
};

const BUCKET_EMPTY: Record<CertificateQueueBucket, { title: string; description: string }> = {
  ALL: { title: "No certificate requests", description: "Every request submitted through either channel will appear here." },
  DRAFT: { title: "Nothing in progress", description: "No requests are currently mid-wizard or awaiting a matched record." },
  MANUAL_REVIEW: { title: "Nothing needs manual review", description: "Requests requiring human review will appear here." },
  PAYMENT_PENDING: { title: "Nothing awaiting payment", description: "Requests with pending or failed demo payment will appear here." },
  DELIVERY_FAILED: { title: "No delivery failures", description: "Certificates that failed to deliver will appear here." },
  REJECTED: { title: "No rejected requests", description: "Requests rejected during manual review will appear here." },
  CANCELLED: { title: "No cancelled requests", description: "Requests cancelled by the requester will appear here." },
};

export default function CertificateRequestQueue({ bucket }: { bucket: CertificateQueueBucket }) {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<BirthCertificateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const { data } = await demoListCertificateRequests({ limit: 500 });
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const statuses = BUCKET_STATUSES[bucket];
  let rows = statuses ? requests.filter((r) => statuses.includes(r.status)) : requests;
  if (search.trim()) {
    const term = search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.applicationReference.toLowerCase().includes(term) ||
        fullName(r.subject.firstName, undefined, r.subject.lastName).toLowerCase().includes(term) ||
        r.subject.birthRecordNumber.toLowerCase().includes(term)
    );
  }
  rows = [...rows].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  const columns: QueueColumn<BirthCertificateRequest>[] = [
    { key: "ref", header: "Application reference", render: (r) => r.applicationReference },
    { key: "requesterType", header: "Requester type", render: (r) => r.requester.requesterType.replace(/_/g, " ") },
    { key: "subject", header: "Subject", render: (r) => (r.subject.lastName ? `${fullName(r.subject.firstName, undefined, r.subject.lastName)} (${maskId(r.subject.dateOfBirth)})` : "Not yet matched") },
    { key: "record", header: "Birth record", render: (r) => r.subject.birthRecordNumber || "—" },
    { key: "channel", header: "Channel", render: (r) => r.channel.replace(/_/g, " ") },
    { key: "submitted", header: "Submitted", render: (r) => formatDateTime(r.submittedAt) },
    { key: "payment", header: "Payment", render: (r) => r.payment.status.replace(/_/g, " ") },
    { key: "status", header: "Status", render: (r) => <StatusBadge kind="certificateRequest" status={r.status} /> },
    {
      key: "assigned",
      header: "Assigned",
      render: (r) => r.assignedRegistrar?.name || r.assignedOfficer?.name || r.assignedSupervisor?.name || "—",
    },
    {
      key: "action",
      header: "",
      render: (r) => (
        <Button
          text={r.status === "MANUAL_REVIEW" ? "Review" : "Open"}
          size="sm"
          appearance="ghost"
          onClick={() =>
            navigate(
              r.status === "MANUAL_REVIEW"
                ? `/dashboard/crvs/certificates/review/${r.id}`
                : `/dashboard/crvs/certificates/requests/${r.id}`
            )
          }
          testId={`open-certificate-request-${r.id}`}
        />
      ),
    },
  ];

  return (
    <>
      <div className="crvs-filter-bar">
        <input
          type="search"
          placeholder="Search by reference, subject, or record number"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="certificate-queue-search"
          style={{ minWidth: 280 }}
        />
      </div>
      <div className="crvs-section">
        <CaseQueueTable
          rows={rows}
          columns={columns}
          getRowKey={(r) => r.id}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle={BUCKET_EMPTY[bucket].title}
          emptyDescription={BUCKET_EMPTY[bucket].description}
          emptyIcon="inbox"
        />
      </div>
    </>
  );
}
