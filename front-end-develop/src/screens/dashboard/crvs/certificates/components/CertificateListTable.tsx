import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CaseQueueTable, { QueueColumn } from "../../components/CaseQueueTable";
import StatusBadge from "../../components/StatusBadge";
import Button from "@/components/button";
import { getDemoData } from "@/demo/storage/demoStore";
import { BirthCertificateStatus, DemoBirthCertificate } from "@/domain/crvs/types";
import { formatDateTime, fullName } from "../utils";

export default function CertificateListTable({ status }: { status: BirthCertificateStatus }) {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<DemoBirthCertificate[]>([]);

  useEffect(() => {
    const db = getDemoData();
    setCertificates(db.crvsCertificates.filter((c) => c.status === status));
  }, [status]);

  const columns: QueueColumn<DemoBirthCertificate>[] = [
    { key: "number", header: "Certificate number", render: (c) => c.certificateNumber },
    { key: "subject", header: "Subject", render: (c) => fullName(c.subject.firstName, c.subject.middleName, c.subject.lastName) },
    { key: "record", header: "Birth record", render: (c) => c.birthRecordNumber },
    { key: "status", header: "Status", render: (c) => <StatusBadge kind="certificate" status={c.status} /> },
    { key: "issued", header: "Issued", render: (c) => formatDateTime(c.issuedAt) },
    { key: "downloads", header: "Downloads", render: (c) => c.downloadCount },
    {
      key: "action",
      header: "",
      render: (c) => (
        <Button text="Open" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/certificates/issued/${c.id}`)} testId={`open-certificate-${c.id}`} />
      ),
    },
  ];

  return (
    <div className="crvs-section">
      <CaseQueueTable
        rows={certificates}
        columns={columns}
        getRowKey={(c) => c.id}
        emptyTitle={status === "REVOKED" ? "No revoked certificates" : "No certificates yet"}
        emptyIcon={status === "REVOKED" ? "block" : "workspace_premium"}
      />
    </div>
  );
}
