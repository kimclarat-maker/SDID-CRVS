import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import Notice from "@/components/public/Notice";
import AnnulmentRegistrationWizard from "../components/AnnulmentRegistrationWizard";
import { demoGetAnnulmentRegistration } from "@/demo/services/crvsAnnulmentRegistrations";
import { ANNULMENT_REGISTRATION_STATUS_LABELS } from "@/domain/crvs/statusMachines";
import { AnnulmentRegistration, AnnulmentRegistrationStatus } from "@/domain/crvs/types";
import "@/screens/dashboard/crvs/shared.css";
import "../../marriageAnnulmentPublic.css";

const PUBLIC_ACTOR_NAME = "Public applicant";

/** The only two states a public applicant may still edit: a draft they have
 * not submitted, and a submitted request a registrar has sent back for
 * correction. */
const EDITABLE_STATUSES: AnnulmentRegistrationStatus[] = ["DRAFT", "CORRECTION_REQUIRED"];

/**
 * Hosts AnnulmentRegistrationWizard at both
 * /civil-registration/marriage-annulment/register/:draftId and its /review
 * alias. The /review URL opens straight on the final step; the plain URL
 * opens on step one and the wizard's own stepper handles everything in
 * between. Mirrors the public divorce declaration wizard host.
 *
 * demoGetAnnulmentRegistration() throws NotFoundError rather than returning
 * undefined (unlike its divorce equivalent) — the load below is wrapped in a
 * try/catch, and also defensively checks a falsy result, so either contract
 * is handled correctly.
 */
export default function PublicAnnulmentRegistrationWizard() {
  const { draftId } = useParams<{ draftId: string }>();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [registration, setRegistration] = useState<AnnulmentRegistration | undefined>();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Mirrors `registration` synchronously so onSubmitted — which fires in the
  // same tick as the final onCaseChange — can read the just-submitted record.
  const registrationRef = useRef<AnnulmentRegistration | undefined>();

  const openOnReview = pathname.endsWith("/review");

  useEffect(() => {
    if (!draftId) return;
    let cancelled = false;
    demoGetAnnulmentRegistration(draftId)
      .then((found) => {
        if (cancelled) return;
        if (!found) {
          setNotFound(true);
          return;
        }
        registrationRef.current = found;
        setRegistration(found);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [draftId]);

  const handleCaseChange = (updated: AnnulmentRegistration) => {
    registrationRef.current = updated;
    setRegistration(updated);
  };

  if (loading) {
    return <PageHeader title="Loading your registration request…" eyebrow="Civil registration" />;
  }

  if (notFound || !registration) {
    return (
      <>
        <PageHeader
          title="We couldn't find that registration request"
          eyebrow="Civil registration"
          breadcrumb={[
            { label: "Home", href: "/" },
            { label: "Marriage annulment registration", href: "/civil-registration/marriage-annulment" },
            { label: "Not found" },
          ]}
        />
        <Section>
          <Notice type="warning" title="Check your reference">
            The reference may have been typed incorrectly, or this request may have been removed. You can start a new
            registration, or track an existing one using its reference.
          </Notice>
          <div className="public-hero-actions" style={{ marginTop: "1.5rem" }}>
            <button
              type="button"
              className="public-btn public-btn-primary"
              onClick={() => navigate("/civil-registration/marriage-annulment/register")}
              data-testid="annulment-wizard-start-new"
            >
              Start a new registration
            </button>
            <button
              type="button"
              className="public-btn public-btn-outline"
              onClick={() => navigate("/civil-registration/marriage-annulment")}
              data-testid="annulment-wizard-back-to-service"
            >
              Back to marriage annulment registration
            </button>
          </div>
        </Section>
      </>
    );
  }

  if (!EDITABLE_STATUSES.includes(registration.status)) {
    return (
      <>
        <PageHeader
          title={registration.reference}
          eyebrow="Civil registration"
          description={`This request is ${ANNULMENT_REGISTRATION_STATUS_LABELS[registration.status].toLowerCase()} and can no longer be edited here.`}
        />
        <Section>
          <Notice type="info" title="Track this request instead">
            Once a request has been submitted it can only be changed if a registration officer asks you for a
            correction. If that happens you will be sent a secure link.
          </Notice>
          <div className="public-hero-actions" style={{ marginTop: "1.5rem" }}>
            <button
              type="button"
              className="public-btn public-btn-primary"
              onClick={() => navigate(`/civil-registration/marriage-annulment/case/${registration.reference}`)}
              data-testid="annulment-wizard-track"
            >
              Track this registration
            </button>
            <button
              type="button"
              className="public-btn public-btn-outline"
              onClick={() => navigate("/civil-registration/marriage-annulment")}
              data-testid="annulment-wizard-exit-to-service"
            >
              Back to marriage annulment registration
            </button>
          </div>
        </Section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={registration.status === "CORRECTION_REQUIRED" ? "Correct your annulment registration request" : "Register a marriage annulment"}
        description={`Reference ${registration.reference} — your progress is saved automatically as you move between steps.`}
        eyebrow="Civil registration"
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Marriage annulment registration", href: "/civil-registration/marriage-annulment" },
          { label: registration.reference },
        ]}
      />
      <div className="public-container annulment-public-body">
        <AnnulmentRegistrationWizard
          registration={registration}
          onCaseChange={handleCaseChange}
          actorNameOverride={PUBLIC_ACTOR_NAME}
          initialStepKey={openOnReview ? "review" : undefined}
          onExit={() => navigate("/civil-registration/marriage-annulment")}
          onSubmitted={(id) => navigate(`/civil-registration/marriage-annulment/register/${id}/success`)}
        />
      </div>
    </>
  );
}
