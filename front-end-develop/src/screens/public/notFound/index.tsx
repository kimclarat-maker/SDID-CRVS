import { usePublicLanguage } from "@/context/PublicLanguageContext";
import PublicButton from "@/components/public/PublicButton";
import Section from "@/components/public/Section";

export default function PublicNotFound() {
  const { content } = usePublicLanguage();

  return (
    <Section heading="Page not found">
      <p className="public-section-intro">
        This page does not exist or may have moved.
      </p>
      <PublicButton href="/" variant="primary">
        {content.common.common.backToHome}
      </PublicButton>
    </Section>
  );
}
