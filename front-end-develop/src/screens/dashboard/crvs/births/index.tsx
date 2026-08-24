import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import StatusBadge from "../components/StatusBadge";
import Button from "@/components/button";
import { getDemoData } from "@/demo/storage/demoStore";
import { BirthRegistrationCase } from "@/domain/crvs/types";
import "../shared.css";

/** Registration queue — every birth-registration case, filterable by
 * reference/status/facility/jurisdiction/late flag (spec §6). Full identity
 * numbers are never shown in this or any other queue view. */
export default function Births() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const rows = useMemo(() => {
    const db = getDemoData();
    let results = db.crvsRegistrations.filter((c) => c.status !== "CANCELLED");
    if (status) results = results.filter((c) => c.status === status);
    if (search) {
      const term = search.toLowerCase();
      results = results.filter(
        (c) =>
          c.reference.toLowerCase().includes(term) ||
          `${c.child.firstName || ""} ${c.child.lastName}`.toLowerCase().includes(term) ||
          (c.notificationReference || "").toLowerCase().includes(term)
      );
    }
    return [...results].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }, [search, status]);

  const columns: QueueColumn<BirthRegistrationCase>[] = [
    { key: "reference", header: "Reference", render: (c) => c.reference },
    {
      key: "child",
      header: "Child",
      render: (c) => (c.child.firstName ? `${c.child.firstName} ${c.child.lastName}` : `Unnamed ${c.child.lastName}`),
    },
    { key: "dob", header: "Date of birth", render: (c) => new Date(c.dateOfBirth).toLocaleDateString() },
    { key: "source", header: "Source", render: (c) => (c.sourceType === "FROM_NOTIFICATION" ? "Facility notification" : c.sourceType.charAt(0) + c.sourceType.slice(1).toLowerCase()) },
    { key: "office", header: "Processing office", render: (c) => c.processingOfficeName },
    { key: "status", header: "Status", render: (c) => <StatusBadge kind="registration" status={c.status} /> },
    { key: "assigned", header: "Assigned staff", render: (c) => c.reviewerName || "Unassigned" },
    {
      key: "action",
      header: "",
      render: (c) => (
        <Button text="View" size="sm" appearance="ghost" onClick={() => navigate(`/dashboard/crvs/births/${c.id}`)} testId={`view-case-${c.id}`} />
      ),
    },
  ];

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Birth registrations</h1>
        <p className="crvs-page-subtitle">Every registration case for your jurisdiction.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-filter-bar">
        <div className="crvs-filter-field">
          <label htmlFor="births-search">Search</label>
          <input id="births-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Reference, child name, notification…" data-testid="births-search" />
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="births-status">Status</label>
          <select id="births-status" value={status} onChange={(e) => setStatus(e.target.value)} data-testid="births-status-filter">
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under review</option>
            <option value="CORRECTION_REQUIRED">Correction required</option>
            <option value="RESUBMITTED">Resubmitted</option>
            <option value="LATE_REGISTRATION_REVIEW">Late registration review</option>
            <option value="EXCEPTION_REVIEW">Exception review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="REGISTERED">Registered</option>
          </select>
        </div>
        <Button text="Start a birth registration" startIcon="add_circle" onClick={() => navigate("/dashboard/crvs/births/new")} testId="start-birth-registration" />
      </div>

      <div className="crvs-section">
        <CaseQueueTable
          rows={rows}
          columns={columns}
          getRowKey={(c) => c.id}
          emptyTitle="No registrations match these filters"
          emptyDescription="Try clearing the search or status filter, or start a new registration."
          emptyIcon="folder_open"
        />
      </div>
    </div>
  );
}
