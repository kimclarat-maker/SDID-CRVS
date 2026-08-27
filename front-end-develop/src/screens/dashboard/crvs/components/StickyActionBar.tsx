export type StickyActionBarProps = {
  children: React.ReactNode;
  align?: "start" | "end" | "between";
};

/** Thin sticky-footer layout primitive — marriage needs this pattern on
 * more workspaces (eligibility review, ceremony workspace, appointment
 * detail) than death did (which only needed it once, replicated as
 * page-local CSS). No state of its own; action buttons stay page-local
 * per the existing "no modal registry" convention. Transitions are
 * intentionally subtle (160-220ms via .crvs-sticky-actionbar in shared.css). */
export default function StickyActionBar({ children, align = "end" }: StickyActionBarProps) {
  return (
    <div className={`crvs-sticky-actionbar crvs-sticky-actionbar-${align}`} role="group" aria-label="Actions">
      {children}
    </div>
  );
}
