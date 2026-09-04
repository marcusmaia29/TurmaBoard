import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Previous / label / next, with an optional reset beside it.
 *
 * The reset is a peer button rather than a link nested under the label, so the
 * week board and the calendar offer "Hoje" the same way.
 */
export function PeriodSwitcher({
  label,
  previousLabel,
  nextLabel,
  onPrevious,
  onNext,
  reset,
  isPreviousDisabled = false,
  isNextDisabled = false,
}: {
  label: string;
  previousLabel: string;
  nextLabel: string;
  onPrevious: () => void;
  onNext: () => void;
  reset?: { label: string; onReset: () => void };
  isPreviousDisabled?: boolean;
  isNextDisabled?: boolean;
}) {
  return (
    <div className="period-switcher">
      <button className="icon-button" type="button" onClick={onPrevious} aria-label={previousLabel} disabled={isPreviousDisabled}>
        <ChevronLeft aria-hidden="true" />
      </button>
      <strong>{label}</strong>
      <button className="icon-button" type="button" onClick={onNext} aria-label={nextLabel} disabled={isNextDisabled}>
        <ChevronRight aria-hidden="true" />
      </button>
      {reset && (
        <button className="secondary-button period-reset" type="button" onClick={reset.onReset}>
          {reset.label}
        </button>
      )}
    </div>
  );
}
