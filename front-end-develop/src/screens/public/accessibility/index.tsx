import { usePublicLanguage } from "@/context/PublicLanguageContext";
import StaticContentSections from "@/components/public/StaticContentSections";

export default function Accessibility() {
  const { content } = usePublicLanguage();
  return (
    <StaticContentSections
      page={content.accessibility}
      breadcrumbLabel={content.common.footer.accessibility}
    />
  );
}
