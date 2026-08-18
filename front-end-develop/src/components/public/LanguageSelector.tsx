import { platformConfig } from "@/config/platform.config";
import { usePublicLanguage } from "@/context/PublicLanguageContext";

export default function LanguageSelector() {
  const { languageCode, setLanguageCode, content } = usePublicLanguage();

  if (platformConfig.languages.length <= 1) return null;

  return (
    <div>
      <label className="visually-hidden" htmlFor="public-language-select">
        {content.common.common.languageSelectorLabel}
      </label>
      <select
        id="public-language-select"
        className="public-language-select"
        value={languageCode}
        onChange={(event) => setLanguageCode(event.target.value)}
      >
        {platformConfig.languages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.label}
          </option>
        ))}
      </select>
    </div>
  );
}
