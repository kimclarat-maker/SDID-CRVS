import { ServicePageFaq } from "@/types/PublicContent";

export default function FaqList({ items }: { items: ServicePageFaq[] }) {
  if (!items.length) return null;

  return (
    <div>
      {items.map((item) => (
        <details className="public-faq-item" key={item.question}>
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
