import { ReactNode } from "react";
import Reveal from "./Reveal";

interface SectionProps {
  id?: string;
  heading?: string;
  intro?: string;
  alt?: boolean;
  children: ReactNode;
  headingLevel?: "h2" | "h3";
}

export default function Section({
  id,
  heading,
  intro,
  alt,
  children,
  headingLevel = "h2",
}: SectionProps) {
  const HeadingTag = headingLevel;

  return (
    <section
      id={id}
      className={`public-section${alt ? " public-section-alt" : ""}`}
    >
      <Reveal className="public-container">
        {heading && <HeadingTag>{heading}</HeadingTag>}
        {intro && <p className="public-section-intro">{intro}</p>}
        {children}
      </Reveal>
    </section>
  );
}
