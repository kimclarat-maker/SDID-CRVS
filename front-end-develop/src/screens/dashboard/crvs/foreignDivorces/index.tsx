import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CaseQueueTable, { QueueColumn } from "../components/CaseQueueTable";
import StatusBadge from "../components/StatusBadge";
import Button from "@/components/button";
import Empty from "@/components/empty";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import { demoListDivorceRegistrations } from "@/demo/services/crvsDivorceRegistrations";
import { divorcePolicyConfig } from "@/domain/crvs/divorcePolicyConfig";
import { DivorceRegistration, ForeignDivorceRecognitionStatus } from "@/domain/crvs/types";
import { divorceSlaState, FOREIGN_RECOGNITION_STATUS_LABELS, formatDate, formerSpousesLabel } from "../divorceShared";
import "../shared.css";

const RECOGNITION_TONE: Record<ForeignDivorceRecognitionStatus, string> = {
  NOT_APPLICABLE: "neutral",
  PENDING: "info",
  REQUIREMENTS_SATISFIED: "success",
  REQUIRES_LEGAL_REVIEW: "warning",
  REJECTED: "danger",
};

/** Foreign divorce decisions queue — every registration whose judgment was
 * granted outside the country (judgment.isForeign), regardless of which
 * review branch it is currently sitting in. */
export default function ForeignDivorcesQueue() {
  const navigate = useNavigate();
  const canView = hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_FOREIGN_JUDGMENT_REVIEW);

  const [registrations, setRegistrations] = useState<DivorceRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [countryFilter, setCountryFilter] = useState("");
  const [recognitionFilter, setRecognitionFilter] = useState<ForeignDivorceRecognitionStatus | "">("");
  const [outstandingOnly, setOutstandingOnly] = useState(false);

  const load = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const { data } = await demoListDivorceRegistrations({ limit: 500 });
      setRegistrations(data.filter((r) => r.judgment.isForeign));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load foreign divorce decisions.");
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    load();
  }, [load]);

  const countries = useMemo(() => Array.from(new Set(registrations.map((r) => r.judgment.country).filter(Boolean))).sort(), [registrations]);

  const rows = useMemo(
    () =>
      registrations.filter((r) => {
        if (countryFilter && r.judgment.country !== countryFilter) return false;
        if (recognitionFilter && r.foreignRecognition.status !== recognitionFilter) return false;
        if (outstandingOnly && r.foreignRecognition.missingRequirements.length === 0) return false;
        return true;
      }),
    [registrations, countryFilter, recognitionFilter, outstandingOnly]
  );

  const columns: QueueColumn<DivorceRegistration>[] = [
    { key: "reference", header: "Reference", render: (r) => r.reference },
    { key: "spouses", header: "Former spouses", render: (r) => formerSpousesLabel(r) },
    { key: "country", header: "Country", render: (r) => r.judgment.country || "—" },
    { key: "authority", header: "Foreign court or authority", render: (r) => r.foreignRecognition.foreignCourtOrAuthority || r.judgment.courtOrAuthorityName || "—" },
    { key: "judgment", header: "Judgment number", render: (r) => r.judgment.judgmentNumber || "—" },
    { key: "final", header: "Final on", render: (r) => (r.judgment.finalityDate ? formatDate(r.judgment.finalityDate) : "Not reported") },
    {
      key: "recognition",
      header: "Recognition status",
      render: (r) => <span className={`crvs-status-pill crvs-status-${RECOGNITION_TONE[r.foreignRecognition.status]}`}>{FOREIGN_RECOGNITION_STATUS_LABELS[r.foreignRecognition.status]}</span>,
    },
    {
      key: "missing",
      header: "Outstanding requirements",
      render: (r) => (r.foreignRecognition.missingRequirements.length === 0 ? "None recorded" : r.foreignRecognition.missingRequirements.join(", ")),
    },
    { key: "status", header: "Case status", render: (r) => <StatusBadge kind="divorceRegistration" status={r.status} /> },
    {
      key: "sla",
      header: "SLA",
      render: (r) => {
        if (r.status === "REGISTERED" || r.status === "REJECTED" || r.status === "CANCELLED") return "—";
        const sla = divorceSlaState(r);
        return <span className={`crvs-status-pill crvs-status-${sla.tone}`}>{sla.label}</span>;
      },
    },
    {
      key: "actions",
      header: "",
      render: (r) => <Button text="Review" size="sm" appearance="ghost" type="button" onClick={() => navigate(`/dashboard/crvs/foreign-divorces/${r.id}`)} testId={`fd-view-${r.id}`} />,
    },
  ];

  if (!canView) {
    return (
      <div className="crvs-page">
        <Empty
          icon="lock"
          title="You don't have access to foreign divorce decisions"
          description="Reviewing foreign divorce decisions requires divorce-foreign-judgment-review access."
          isFullScreen
        />
      </div>
    );
  }

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Foreign divorce decisions</h1>
        <p className="crvs-page-subtitle">
          Divorce registrations based on a decision granted outside the country. The configured review allowance is {divorcePolicyConfig.sla.foreignReviewDays} days.
        </p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-banner crvs-banner-info">
        This is a configured frontend policy workflow only. It records whether the demo&apos;s recognition requirements are met — it is never a binding legal determination about a foreign decision&apos;s
        effect.
      </div>

      <div className="crvs-filter-bar">
        <div className="crvs-filter-field">
          <label htmlFor="fd-country">Country</label>
          <select id="fd-country" value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} data-testid="fd-country-filter">
            <option value="">All countries</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="fd-recognition">Recognition status</label>
          <select id="fd-recognition" value={recognitionFilter} onChange={(e) => setRecognitionFilter(e.target.value as ForeignDivorceRecognitionStatus | "")} data-testid="fd-recognition-filter">
            <option value="">Any status</option>
            {(Object.keys(FOREIGN_RECOGNITION_STATUS_LABELS) as ForeignDivorceRecognitionStatus[]).map((key) => (
              <option key={key} value={key}>
                {FOREIGN_RECOGNITION_STATUS_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="crvs-filter-field">
          <label htmlFor="fd-outstanding">Requirements</label>
          <label htmlFor="fd-outstanding" style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400 }}>
            <input id="fd-outstanding" type="checkbox" checked={outstandingOnly} onChange={(e) => setOutstandingOnly(e.target.checked)} data-testid="fd-outstanding-filter" />
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
          emptyTitle="No foreign divorce decisions"
          emptyDescription="No divorce registration on record is based on a decision granted outside the country."
          emptyIcon="public_off"
        />
      </div>
    </div>
  );
}
