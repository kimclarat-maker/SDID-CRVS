import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Button from "@/components/button";
import Empty from "@/components/empty";
import RequirePermission from "@/navigation/guards/RequirePermission";
import { DescriptionList, DescriptionItem } from "@/components/descriptionList";
import { cfg } from "@/constants/cfg";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { BirthRegistrationCase } from "@/domain/crvs/types";
import { demoGetRegistration } from "@/demo/services/crvsRegistrations";
import { demoProcessSdidSync } from "@/demo/services/crvsSdidSync";
import StatusBadge from "../../components/StatusBadge";
import StatusTimeline from "../../components/StatusTimeline";
import "../../shared.css";

/** Same self-contained session read used across the exceptions/registered-
 * births screens — there is no exported getCurrentActorName() in
 * utils/workspace, so this mirrors its storage key/shape locally. */
function currentActorName(): string {
  try {
    const key = cfg.VITE_APP_NAME || "SDID-ENROLLMENT";
    const raw = sessionStorage.getItem(key);
    if (!raw) return "CRVS Staff";
    const session = JSON.parse(raw);
    const account = session?.account;
    const name = [account?.firstName, account?.lastName].filter(Boolean).join(" ").trim();
    return name || account?.email || session?.email || "CRVS Staff";
  } catch {
    return "CRVS Staff";
  }
}

function maskTail(value?: string, visible = 4): string {
  if (!value) return "—";
  if (value.length <= visible) return value;
  return `••••${value.slice(-visible)}`;
}

function RegisteredBirthDetailsInner() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const actorName = currentActorName();
  const detailRef = useRef<HTMLDivElement>(null);

  const [registrationCase, setRegistrationCase] = useState<BirthRegistrationCase | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const syncKicked = useRef(false);

  const load = () => {
    if (!caseId) return;
    setLoading(true);
    setError(undefined);
    demoGetRegistration(caseId)
      .then((c) => setRegistrationCase(c))
      .catch((e) => setError(e?.message || "Something went wrong loading this case."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [caseId]);

  // Visibly progress the demo synchronization simulation exactly once per
  // mount when a just-registered case is still PENDING (spec: "call this
  // automatically when a registered-births detail page mounts").
  useEffect(() => {
    if (!registrationCase || syncKicked.current) return;
    if (registrationCase.sdid.status !== "PENDING") return;
    syncKicked.current = true;
    demoProcessSdidSync(registrationCase.id, actorName)
      .catch(() => undefined)
      .finally(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrationCase]);

  if (loading) {
    return (
      <div className="crvs-page">
        <div className="crvs-section" aria-busy="true">
          Loading registered birth…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="crvs-page">
        <Empty
          icon="error"
          title="Couldn't load this case"
          description={error}
          button={<Button text="Try again" appearance="ghost" onClick={load} testId="registered-birth-retry" />}
        />
      </div>
    );
  }

  if (!registrationCase) {
    return (
      <div className="crvs-page">
        <Empty icon="search_off" title="Case not found" description="This case does not exist or is no longer accessible." />
      </div>
    );
  }

  if (registrationCase.status !== "REGISTERED") {
    return (
      <div className="crvs-page">
        <Empty
          icon="hourglass_empty"
          title="This case has not been registered yet"
          description={`Current status: ${registrationCase.status}.`}
        />
      </div>
    );
  }

  const nin = registrationCase.sdid.status === "IDENTITY_CREATED" ? registrationCase.sdid.fictionalNin : undefined;

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Registration successful</h1>
        <p className="crvs-page-subtitle">
          {registrationCase.child.firstName} {registrationCase.child.lastName} has been officially registered.
        </p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-section">
        <DescriptionList columns={3}>
          <DescriptionItem label="Official birth record number" value={registrationCase.officialBirthRecordNumber} />
          <DescriptionItem label="Registration date" value={registrationCase.registeredAt ? new Date(registrationCase.registeredAt).toLocaleString() : undefined} />
          <DescriptionItem label="Civil Registrar" value={registrationCase.approvedByName} />
          <DescriptionItem label="Processing jurisdiction" value={registrationCase.jurisdiction} />
          <DescriptionItem label="Processing office" value={registrationCase.processingOfficeName} />
          <DescriptionItem label="Application reference" value={registrationCase.reference} />
        </DescriptionList>

        <div className="crvs-banner crvs-banner-info" style={{ marginTop: 16 }}>
          CRVS registration is complete. Synchronizing this birth record with the SDID foundational-identity system is a
          separate, later step and does not affect the validity of this registration.
        </div>

        <div className="crvs-review-section" style={{ marginTop: 16 }}>
          <div className="crvs-review-section-header">
            <strong>SDID synchronization status</strong>
            <StatusBadge kind="sync" status={registrationCase.sdid.status} />
          </div>
          {nin ? (
            <p className="crvs-form-hint">Fictional NIN: {nin}</p>
          ) : (
            <p className="crvs-form-hint">
              A national identification number is not shown until synchronization completes successfully.
            </p>
          )}
        </div>

        <div className="crvs-wizard-actions" style={{ marginTop: 20 }}>
          <Button
            text="View registered birth"
            appearance="ghost"
            onClick={() => detailRef.current?.scrollIntoView({ behavior: "smooth" })}
            testId="view-registered-birth"
          />
          <Button
            text="View SDID synchronization"
            appearance="primary"
            onClick={() => navigate(`/dashboard/crvs/registered-births/${registrationCase.id}/sdid-status`)}
            testId="view-sdid-status"
          />
          <Button text="Return to review queue" appearance="ghost" onClick={() => navigate("/dashboard/crvs/review")} testId="return-to-review-queue" />
        </div>
      </div>

      <div className="crvs-section">
        <h2 className="crvs-section-title">Status timeline</h2>
        <StatusTimeline registrationCase={registrationCase} />
      </div>

      <div className="crvs-section" ref={detailRef}>
        <h2 className="crvs-section-title">Registered birth detail</h2>
        <DescriptionList columns={3}>
          <DescriptionItem
            label="Child"
            value={`${registrationCase.child.firstName || ""} ${registrationCase.child.lastName}`.trim()}
          />
          <DescriptionItem label="Sex" value={registrationCase.child.sex} />
          <DescriptionItem label="Date of birth" value={registrationCase.child.dateOfBirth} />
          <DescriptionItem label="Place of birth" value={registrationCase.placeOfBirth} />
          <DescriptionItem label="Mother" value={`${registrationCase.mother.firstName} ${registrationCase.mother.lastName}`} />
          <DescriptionItem label="Mother's identity" value={maskTail(registrationCase.mother.documentNumber)} />
          <DescriptionItem
            label="Father"
            value={
              registrationCase.father.firstName
                ? `${registrationCase.father.firstName} ${registrationCase.father.lastName}`
                : registrationCase.father.availability
            }
          />
          <DescriptionItem label="Father's identity" value={maskTail(registrationCase.father.documentNumber)} />
          <DescriptionItem
            label="Declarant"
            value={`${registrationCase.declarant.firstName} ${registrationCase.declarant.lastName} (${registrationCase.declarant.relationship})`}
          />
        </DescriptionList>

        {registrationCase.witnesses.length > 0 && (
          <table className="crvs-table" style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>Witness</th>
                <th>Relationship</th>
                <th>Identity</th>
              </tr>
            </thead>
            <tbody>
              {registrationCase.witnesses.map((w) => (
                <tr key={w.id}>
                  <td>{w.firstName} {w.lastName}</td>
                  <td>{w.relationship}</td>
                  <td>{maskTail(w.documentNumber)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="crvs-wizard-actions">
        <Link to="/dashboard/crvs" className="crvs-tab">
          Back to CRVS home
        </Link>
      </div>
    </div>
  );
}

export default function RegisteredBirthDetails() {
  return (
    <RequirePermission
      workspace="CRVS"
      permission={CRVS_PERMISSIONS.REGISTERED_VIEW}
      fallback={
        <div className="crvs-page">
          <Empty icon="lock" title="You don't have access to registered births" />
        </div>
      }
    >
      <RegisteredBirthDetailsInner />
    </RequirePermission>
  );
}
