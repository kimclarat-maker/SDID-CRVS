import { usePublicLanguage } from "@/context/PublicLanguageContext";
import StaticContentSections from "@/components/public/StaticContentSections";

export default function Privacy() {
  const { content } = usePublicLanguage();
  return (
    <StaticContentSections
      page={content.privacy}
      breadcrumbLabel={content.common.footer.privacy}
      readingLayout
    />
  );
}
