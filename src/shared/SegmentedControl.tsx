/**
 * Equal-width options for switching between views of the same data.
 *
 * Distinct from FilterChips, which is a scrollable row of intrinsic-width pills
 * for narrowing a list. `shortLabel` renders alongside the label so a caller can
 * swap the two by width without the primitive knowing about breakpoints.
 *
 * Visibility belongs to the caller's wrapper, never to this element: putting
 * `display` on both would leave the outcome to source order.
 */
export function SegmentedControl<Value extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<{ value: Value; label: string; shortLabel?: string }>;
  value: Value;
  onChange: (value: Value) => void;
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          className={option.value === value ? "active" : ""}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          key={option.value}
        >
          <span>{option.label}</span>
          {option.shortLabel && <abbr title={option.label}>{option.shortLabel}</abbr>}
        </button>
      ))}
    </div>
  );
}
