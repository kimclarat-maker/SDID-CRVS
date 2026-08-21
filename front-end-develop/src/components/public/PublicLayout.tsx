import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { usePublicLanguage } from "@/context/PublicLanguageContext";
import PublicHeader from "./PublicHeader";
import PublicFooter from "./PublicFooter";
import "@/common/styles/public-fonts.css";
import "@/common/styles/public-design-tokens.css";
import "./public.css";

export default function PublicLayout({ children }: { children: ReactNode }) {
  const { content } = usePublicLanguage();
  const { pathname } = useLocation();
  // Reveal/parallax motion only activates once this mounts, so content
  // stays fully visible if JS fails to load or run (spec §7).
  const [motionReady, setMotionReady] = useState(false);

  useEffect(() => {
    setMotionReady(true);
  }, []);

  useEffect(() => {
    try {
      window.scrollTo(0, 0);
    } catch {
      // scrollTo is unavailable in some test/embedded environments (e.g. jsdom).
    }
  }, [pathname]);

  return (
    <div
      className={`public-app${motionReady ? " js-motion" : ""}`}
      data-theme="light"
    >
      <div className="public-page">
        <div className="public-page-frame">
          <a href="#main-content" className="skip-to-content-link">
            {content.common.nav.skipToContent}
          </a>
          <PublicHeader />
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
          <PublicFooter />
        </div>
      </div>
    </div>
  );
}
