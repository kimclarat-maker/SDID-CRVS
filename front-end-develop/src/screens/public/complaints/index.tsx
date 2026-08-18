import { usePublicLanguage } from "@/context/PublicLanguageContext";
import StaticContentSections from "@/components/public/StaticContentSections";

export default function Complaints() {
  const { content } = usePublicLanguage();
  return (
    <StaticContentSections
      page={content.complaints}
      breadcrumbLabel={content.common.footer.complaints}
    />
  );
}
