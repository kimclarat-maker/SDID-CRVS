import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import Notice from "@/components/public/Notice";
import { getDemoData } from "@/demo/storage/demoStore";

/**
 * Token-gated correction-response landing page (spec §5 route
 * /civil-registration/death/respond/:token). Looks the case up by the
 * correction request's own responseToken — set when a Civil Registrar
 * requests a correction (demoRequestDeathCorrection) — rather than
 * requiring a staff sign-in. Hands off to the same public wizard the
 * original report used for the actual edits, since CORRECTION_REQUIRED is
 * already one of the two statuses that wizard host will load in edit mode.
 */
export default function PublicDeathCorrectionResponse() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const match = useMemo(() => {
    if (!token) return undefined;
    const db = getDemoData();
    for (const deathCase of db.crvsDeathRegistrations) {
      const correction = deathCase.correctionRequests.find((c) => c.responseToken === token && !c.resolvedAt);
      if (correction) return { deathCase, correction };
    }
    return undefined;
  }, [token]);

  if (!match) {
    return (
      <>
        <PageHeader title="Correction request not found" eyebrow="Civil registration" />
        <Section>
          <Notice type="warning" title="This link is no longer valid">
            The correction may already have been addressed, or the link may be incorrect. Contact a service centre for
            help.
          </Notice>
        </Section>
      </>
    );
  }

  const { deathCase, correction } = match;

  return (
    <>
      <PageHeader title="Respond to a correction request" description={deathCase.reference} eyebrow="Civil registration" />
      <Section>
        <Notice type="warning" title={`Requested by ${correction.requestedBy}`}>
          Review the items below, then continue to update your report.
        </Notice>

        <ul className="public-grid public-grid-2" style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}>
          {correction.items.map((item) => (
            <li key={item.id} className="public-card">
              <h3>{item.section.replace(/_/g, " ")}</h3>
              <p>{item.reason}</p>
              {item.note && <p className="public-form-hint">{item.note}</p>}
              {item.fields.length > 0 && <p className="public-form-hint">Fields: {item.fields.join(", ")}</p>}
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="public-btn public-btn-primary"
          style={{ marginTop: "1.5rem" }}
          onClick={() => navigate(`/civil-registration/death/report/${deathCase.id}`)}
          data-testid="respond-continue"
        >
          Continue to update your report
        </button>
      </Section>
    </>
  );
}
