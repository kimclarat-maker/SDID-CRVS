import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import Notice from "@/components/public/Notice";
import { demoGetDeathRegistration } from "@/demo/services/crvsDeathRegistrations";
import { DEATH_REGISTRATION_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { DeathRegistrationCase } from "@/domain/crvs/types";
import toastMessage from "@/utils/common/toastMessage";

/**
 * Public case-tracking page (spec §5 route /civil-registration/death/
 * case/:reference). Deliberately reads and renders only status/summary
 * fields — reference, status, pathway, dates, whether an open correction
 * exists — never deceased document numbers, medical certification, or
 * cause-of-death, which stay staff-only regardless of what's in the
 * underlying record (spec §5 "do not expose restricted cause-of-death
 * details on public case-tracking pages").
 */
export default function PublicDeathCaseStatus() {
  const { reference } = useParams<{ reference: string }>();
  const [searchParams] = useSearchParams();
  const wantsCertificate = searchParams.get("certificate") === "1";

  const [deathCase, setDeathCase] = useState<DeathRegistrationCase | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reference) return;
    demoGetDeathRegistration(reference).then(setDeathCase).finally(() => setLoading(false));
  }, [reference]);

  if (loading) {
    return <PageHeader title="Loading…" eyebrow="Civil registration" />;
  }

  if (!deathCase) {
    return (
      <>
        <PageHeader title="Case not found" eyebrow="Civil registration" />
        <Section>
          <Notice type="warning" title="We couldn't find this case">
            Check the reference and try again, or contact a service centre for help.
          </Notice>
        </Section>
      </>
    );
  }

  const openCorrection = deathCase.correctionRequests.find((c) => !c.resolvedAt);
  const eligibleForCertificate = deathCase.status === "REGISTERED";

  return (
    <>
      <PageHeader title={deathCase.reference} eyebrow="Civil registration — case status" />
      <Section>
        <dl className="public-fact-list">
          <div>
            <dt>Status</dt>
            <dd>{DEATH_REGISTRATION_STATUS_LABELS[deathCase.status]}</dd>
          </div>
          <div>
            <dt>Pathway</dt>
            <dd>{deathCase.pathway.replace(/_/g, " ")}</dd>
          </div>
          <div>
            <dt>Date reported</dt>
            <dd>{deathCase.dateReported?.slice(0, 10) || "—"}</dd>
          </div>
          {deathCase.officialDeathRecordNumber && (
            <div>
              <dt>Official death record number</dt>
              <dd>{deathCase.officialDeathRecordNumber}</dd>
            </div>
          )}
        </dl>

        {openCorrection && (
          <Notice type="warning" title="Action needed">
            A registration officer has requested corrections on this case. Use the link sent to you, or go directly to{" "}
            <Link to={`/civil-registration/death/respond/${openCorrection.responseToken}`}>respond to the correction request</Link>.
          </Notice>
        )}

        {deathCase.status === "REJECTED" && deathCase.rejectionReason && (
          <Notice type="danger" title="This case was rejected">
            {deathCase.rejectionReason.explanation}
          </Notice>
        )}

        {wantsCertificate && (
          <Notice type={eligibleForCertificate ? "success" : "info"} title="Death certificate">
            {eligibleForCertificate ? (
              <>
                This case is registered and eligible for a certificate.{" "}
                <button
                  type="button"
                  className="public-btn public-btn-primary"
                  style={{ marginLeft: 8 }}
                  onClick={() => toastMessage("success", `Certificate request logged for ${deathCase.reference}. A CRVS Registration Officer will process it.`)}
                  data-testid="public-case-request-certificate"
                >
                  Request certificate
                </button>
              </>
            ) : (
              "This case is not registered yet, so a certificate cannot be requested until registration is complete."
            )}
          </Notice>
        )}

        <p className="public-form-hint" style={{ marginTop: "1.5rem" }}>
          Medical and cause-of-death information is never shown on this public page — it is only visible to
          authorized medical and civil registration staff.
        </p>
      </Section>
    </>
  );
}
