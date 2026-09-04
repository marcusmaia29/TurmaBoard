import type { ReactNode } from "react";

/**
 * The control block that sits between a PageHeader and the page content.
 *
 * Row one carries period navigation, contextual actions and the result count;
 * row two, when present, carries filters or a legend. Slots are named so the
 * responsive rules never have to reorder children by grid-column or order.
 */
export function Toolbar({ label, children, filters }: { label: string; children?: ReactNode; filters?: ReactNode }) {
  return (
    <section className="toolbar" aria-label={label}>
      {children && <div className="toolbar-row">{children}</div>}
      {filters && <div className={`toolbar-row${children ? " toolbar-row-filters" : ""}`}>{filters}</div>}
    </section>
  );
}

export function ResultCount({ children, isLive = false }: { children: ReactNode; isLive?: boolean }) {
  return <span className="result-count" aria-live={isLive ? "polite" : undefined}>{children}</span>;
}
