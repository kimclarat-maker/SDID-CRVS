import { useId, useState } from "react";
import { ServicePageFaq } from "@/types/PublicContent";

function FaqItem({ item }: { item: ServicePageFaq }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className={`public-accordion-item${open ? " is-open" : ""}`}>
      <h3 className="public-accordion-heading">
        <button
          type="button"
          className="public-accordion-trigger"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <span>{item.question}</span>
          <span className="public-accordion-icon" aria-hidden="true" />
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        className="public-accordion-panel"
        aria-hidden={!open}
      >
        <div className="public-accordion-panel-inner">
          <p>{item.answer}</p>
        </div>
      </div>
    </div>
  );
}

export default function FaqList({ items }: { items: ServicePageFaq[] }) {
  if (!items.length) return null;

  return (
    <div className="public-accordion">
      {items.map((item) => (
        <FaqItem item={item} key={item.question} />
      ))}
    </div>
  );
}
