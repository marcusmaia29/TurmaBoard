/**
 * A scrollable row of intrinsic-width pills for narrowing a list.
 *
 * Distinct from SegmentedControl, which is an equal-width trough for switching
 * between views. Both use aria-pressed on real buttons inside a labelled group.
 */
export function FilterChips<Value extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<{ value: Value; label: string }>;
  value: Value;
  onChange: (value: Value) => void;
}) {
  return (
    <div className="filter-chips" role="group" aria-label={label}>
      <span className="filter-chips-label">{label}</span>
      <div className="filter-chips-list">
        {options.map((option) => (
          <button
            className={option.value === value ? "active" : ""}
            type="button"
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
            key={option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
