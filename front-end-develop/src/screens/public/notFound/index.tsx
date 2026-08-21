import { usePublicLanguage } from "@/context/PublicLanguageContext";
import PublicButton from "@/components/public/PublicButton";

export default function PublicNotFound() {
  const { content } = usePublicLanguage();

  return (
    <section className="public-not-found">
      <div className="public-container public-not-found-inner">
        <p className="public-not-found-code" aria-hidden="true">
          404
        </p>
        <h1>Page not found</h1>
        <p className="public-section-intro">
          This page does not exist or may have moved. Check the address, or
          use one of the links below to find what you were looking for.
        </p>
        <div className="public-hero-actions">
          <PublicButton href="/" variant="primary">
            {content.common.common.backToHome}
          </PublicButton>
          <PublicButton href="/civil-registration" variant="secondary">
            {content.common.nav.civilRegistration}
          </PublicButton>
        </div>
      </div>
    </section>
  );
}
