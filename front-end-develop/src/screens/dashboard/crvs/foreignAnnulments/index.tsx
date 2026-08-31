import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import Button from "@/components/button";
import Empty from "@/components/empty";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import { demoListAnnulmentRegistrations } from "@/demo/services/crvsAnnulmentRegistrations";
import { annulmentPolicyConfig } from "@/domain/crvs/annulmentPolicyConfig";
import { AnnulmentRegistration, ForeignAnnulmentRecognitionStatus } from "@/domain/crvs/types";
import { affectedPartiesLabel, annulmentSlaState, FOREIGN_RECOGNITION_STATUS_LABELS, formatDate } from "../annulmentShared";
import { AnnulmentRegistrationStatusPill, ForeignAnnulmentRecognitionStatusPill } from "../registeredAnnulments/components/AnnulmentStatusPill";
import "../shared.css";

/** Foreign annulment decisions queue — every registration whose decision was
 * made outside the country (decision.isForeign), regardless of which review
 * branch it is currently sitting in. Mirrors foreignDivorces/index.tsx. */
export default function ForeignAnnulmentsQueue() {
  const navigate = useNavigate();
  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANNULMENT_FOREIGN_DECISION_REVIEW);

  const [registrations, setRegistrations] = useState<AnnulmentRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [countryFilter, setCountryFilter] = useState("");
  const [recognitionFilter, setRecognitionFilter] = useState<ForeignAnnulmentRecognitionStatus | "">("");
  const [outstandingOnly, setOutstandingOnly] = useState(false);

  const load = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const { data } = await demoListAnnulmentRegistrations({ limit: 500 });
      setRegistrations(data.filter((r) => r.decision.isForeign));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load foreign annulment decisions.");
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    load();
  }, [load]);

  const countries = useMemo(() => Array.from(new Set(registrations.map((r) => r.decision.country).filter(Boolean))).sort(), [registrations]);

  const rows = useMemo(
    () =>
      registrations.filter((r) => {
        if (countryFilter && r.decision.country !== countryFilter) return false;
        if (recognitionFilter && r.foreignRecognition.status !== recognitionFilter) return false;
        if (outstandingOnly && r.foreignRecognition.missingRequirements.length === 0) return false;
        return true;
      }),
    [registrations, countryFilter, recognitionFilter, outstandingOnly]
  );

  const columns: QueueColumn<AnnulmentRegistration>[] = [
    { key: "reference", header: "Reference", render: (r) => r.reference },
    { key: "parties", header: "Affected persons", render: (r) => affectedPartiesLabel(r) },
    { key: "country", header: "Country", render: (r) => r.decision.country || "—" },
    { key: "authority", header: "Foreign court or authority", render: (r) => r.foreignRecognition.foreignCourtOrAuthority || r.decision.courtOrAuthorityName || "—" },
    { key: "decisionNumber", header: "Decision number", render: (r) => r.decision.decisionNumber || "—" },
    { key: "final", header: "Final on", render: (r) => (r.decision.finalityDate ? formatDate(r.decision.finalityDate) : "Not reported") },
    { key: "recognition", header: "Recognition status", render: (r) => <ForeignAnnulmentRecognitionStatusPill status={r.foreignRecognition.status} /> },
    {
      key: "missing",
      header: "Outstanding requirements",
      render: (r) => (r.foreignRecognition.missingRequirements.length === 0 ? "None recorded" : r.foreignRecognition.missingRequirements.join(", ")),
    },
    { key: "status", header: "Case status", render: (r) => <AnnulmentRegistrationStatusPill status={r.status} /> },
    {
      key: "sla",
      header: "SLA",
      render: (r) => {
        if (r.status === "REGISTERED" || r.status === "REJECTED" || r.status === "CANCELLED") return "—";
        const sla = annulmentSlaState(r);
        return <span className={`crvs-status-pill crvs-status-${sla.tone}`}>{sla.label}</span>;
      },
    },
    {
      key: "actions",
      header: "",
      render: (r) => <Button text="Review" size="sm" appearance="ghost" type="button" onClick={() => navigate(`/dashboard/crvs/foreign-annulments/${r.id}`)} testId={`fa-view-${r.id}`} />,
    },
  ];

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty
          icon="lock"
          title="You don't have access to foreign annulment decisions"
          description="Reviewing foreign annulment decisions requires annulment-foreign-decision-review access."
          isFullScreen
        />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Foreign annulment decisions</h1>
        <p className="crvs-page-subtitle">
          Marriage-annulment registrations based on a decision made outside the country. The configured review allowance is {annulmentPolicyConfig.sla.foreignReviewDays} days.
        </p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-banner crvs-banner-info">
        This is a configured frontend policy workflow only. It records whether the demo&apos;s recognition requirements are met — it is never a binding legal determination about a foreign decision&apos;s
        effect.
      </div>

      <div className="crvs-filter-bar">
        <div className="crvs-filter-field">
          <label htmlFor="fa-country">Country</label>
          <select id="fa-country" value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} data-testid="fa-country-filter">
            <option value="">All countries</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="fa-recognition">Recognition status</label>
          <select id="fa-recognition" value={recognitionFilter} onChange={(e) => setRecognitionFilter(e.target.value as ForeignAnnulmentRecognitionStatus | "")} data-testid="fa-recognition-filter">
            <option value="">Any status</option>
            {(Object.keys(FOREIGN_RECOGNITION_STATUS_LABELS) as ForeignAnnulmentRecognitionStatus[]).map((key) => (
              <option key={key} value={key}>
                {FOREIGN_RECOGNITION_STATUS_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="fa-outstanding">Requirements</label>
          <label htmlFor="fa-outstanding" style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400 }}>
            <input id="fa-outstanding" type="checkbox" checked={outstandingOnly} onChange={(e) => setOutstandingOnly(e.target.checked)} data-testid="fa-outstanding-filter" />
            Only cases with outstanding requirements
          </label>
        </div>
      </div>

      <div className="crvs-section">
        <CaseQueueTable
          rows={rows}
          columns={columns}
          getRowKey={(r) => r.id}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle="No foreign annulment decisions"
          emptyDescription="No annulment registration on record is based on a decision made outside the country."
          emptyIcon="public_off"
        />
      </div>
    </div>
  );
}
