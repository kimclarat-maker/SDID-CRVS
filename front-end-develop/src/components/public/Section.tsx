import { ReactNode } from "react";
import Reveal from "./Reveal";

interface SectionProps {
  id?: string;
  heading?: string;
  intro?: string;
  eyebrow?: string;
  alt?: boolean;
  dark?: boolean;
  spacing?: "compact" | "standard" | "xl";
  children: ReactNode;
  headingLevel?: "h2" | "h3";
}

export default function Section({
  id,
  heading,
  intro,
  eyebrow,
  alt,
  dark,
  spacing = "standard",
  children,
  headingLevel = "h2",
}: SectionProps) {
  const HeadingTag = headingLevel;
  const spacingClass =
    spacing === "compact"
      ? " public-section-compact"
      : spacing === "xl"
      ? " public-section-xl"
      : "";

  return (
    <section
      id={id}
      className={`public-section${spacingClass}${
        dark ? " public-section-dark" : alt ? " public-section-alt" : ""
      }`}
    >
      <Reveal className="public-container">
        {eyebrow && <p className="public-eyebrow-label">{eyebrow}</p>}
        {heading && <HeadingTag>{heading}</HeadingTag>}
        {intro && <p className="public-section-intro">{intro}</p>}
        {children}
      </Reveal>
    </section>
  );
}
