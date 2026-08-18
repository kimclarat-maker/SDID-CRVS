import { usePublicLanguage } from "@/context/PublicLanguageContext";
import StaticContentSections from "@/components/public/StaticContentSections";

export default function Help() {
  const { content } = usePublicLanguage();
  return (
    <StaticContentSections
      page={content.help}
      breadcrumbLabel={content.common.nav.help}
    />
  );
}
