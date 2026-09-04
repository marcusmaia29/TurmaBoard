import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { Menu } from "./Menu";

/**
 * The compact form of FilterChips: one trigger that opens the same options as a
 * single-choice menu. Used only where the chips would not fit — on wide screens
 * the options stay visible, per the design system's rule about hiding controls.
 */
export function FilterMenu<Value extends string>({
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
  const active = options.find((option) => option.value === value);

  return (
    <Menu
      label={`${label}: ${active?.label ?? ""}`}
      className="menu-wrapper filter-menu"
      triggerClassName="secondary-button filter-menu-trigger"
      panelClassName="menu-panel menu-panel-wide"
      panelRole="menu"
      triggerContent={
        <>
          <SlidersHorizontal aria-hidden="true" />
          <span>{active?.label}</span>
          <ChevronDown className="menu-chevron" aria-hidden="true" />
        </>
      }
    >
      {(close) => options.map((option) => (
        <button
          className={option.value === value ? "active" : ""}
          role="menuitemradio"
          aria-checked={option.value === value}
          type="button"
          onClick={() => { close(); onChange(option.value); }}
          key={option.value}
        >
          {option.label}
        </button>
      ))}
    </Menu>
  );
}
