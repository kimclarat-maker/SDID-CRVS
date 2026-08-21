import { HomeContent } from "@/types/PublicContent";
import Notice from "./Notice";
import Carousel from "./Carousel";
import Reveal from "./Reveal";

export default function NoticesPanel({
  notices,
}: {
  notices: HomeContent["notices"];
}) {
  if (!notices.items.length) return null;

  return (
    <section className="public-section public-section-alt">
      <Reveal className="public-container public-notices-layout">
        <div className="public-notices-intro">
          <h2>{notices.heading}</h2>
        </div>

        <div className="public-notices-stack">
          <Carousel
            ariaLabel={notices.heading}
            items={notices.items.map((notice) => ({
              id: notice.title,
              content: (
                <Notice type={notice.type} title={notice.title}>
                  {notice.message}
                </Notice>
              ),
            }))}
          />
        </div>
      </Reveal>
    </section>
  );
}
