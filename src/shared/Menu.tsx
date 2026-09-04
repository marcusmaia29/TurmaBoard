import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { focusableSelector } from "./focus";

/**
 * A trigger plus a panel that opens beneath it.
 *
 * The panel is rendered inline rather than through a portal: closing on an
 * outside click relies on the wrapper containing the event target, and a portal
 * would put the panel outside that subtree — the panel would unmount on
 * mousedown and the click would never reach the item inside it.
 *
 * Keyboard events are handled on the wrapper node, not on window, so Escape is
 * consumed here and never reaches the window listener a surrounding Dialog uses
 * to close itself.
 *
 * The caller owns the panel's semantics: pass `panelRole="menu"` for a list of
 * commands, or leave it off for a disclosure holding real links, where
 * role="menuitem" would replace their implicit link role.
 */
export function Menu({
  label,
  triggerContent,
  className = "menu-wrapper",
  triggerClassName,
  panelClassName,
  panelRole,
  children,
}: {
  label: string;
  triggerContent: ReactNode;
  className?: string;
  triggerClassName?: string;
  panelClassName?: string;
  panelRole?: "menu";
  children: (close: () => void) => ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setIsOpen(false), []);
  const closeAndRestoreFocus = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const wrapper = wrapperRef.current;
    const items = () => Array.from(panelRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
    items()[0]?.focus();

    function moveFocus(offset: number) {
      const focusable = items();
      if (!focusable.length) return;
      const current = focusable.indexOf(document.activeElement as HTMLElement);
      const next = (current + offset + focusable.length) % focusable.length;
      focusable[next]?.focus();
    }

    function handleKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case "Escape":
          event.preventDefault();
          event.stopPropagation();
          closeAndRestoreFocus();
          return;
        case "Tab":
          // Let focus leave naturally, but never leave an open panel behind it.
          close();
          return;
        case "ArrowDown":
          event.preventDefault();
          moveFocus(1);
          return;
        case "ArrowUp":
          event.preventDefault();
          moveFocus(-1);
          return;
        case "Home":
          event.preventDefault();
          items()[0]?.focus();
          return;
        case "End": {
          event.preventDefault();
          const focusable = items();
          focusable[focusable.length - 1]?.focus();
        }
      }
    }

    function handleOutsideMouseDown(event: MouseEvent) {
      if (wrapper?.contains(event.target as Node)) return;
      close();
    }

    wrapper?.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleOutsideMouseDown);
    return () => {
      wrapper?.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleOutsideMouseDown);
    };
  }, [close, closeAndRestoreFocus, isOpen]);

  return (
    <div className={className} ref={wrapperRef}>
      <button
        className={triggerClassName}
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-expanded={isOpen}
        aria-haspopup={panelRole === "menu" ? "menu" : undefined}
        onClick={() => setIsOpen((current) => !current)}
      >
        {triggerContent}
      </button>
      {isOpen && (
        <div className={panelClassName} ref={panelRef} role={panelRole}>
          {children(close)}
        </div>
      )}
    </div>
  );
}
