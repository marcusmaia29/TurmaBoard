import { CalendarClock, ExternalLink, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { DeliveryWithSubject } from "../../lib/database.types";
import { formatDeadline, formatRelativeDate, getDeadlineTone } from "../../lib/date";
import { deliveryTypeLabels } from "./delivery.constants";

export function DeliveryCard({
  delivery,
  isAdmin,
  onEdit,
  onDelete,
}: {
  delivery: DeliveryWithSubject;
  isAdmin: boolean;
  onEdit: (delivery: DeliveryWithSubject) => void;
  onDelete: (delivery: DeliveryWithSubject) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuWrapperRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const deadline = formatDeadline(delivery.due_at);
  const tone = getDeadlineTone(delivery.due_at);

  useEffect(() => {
    if (!showMenu) return;
    const wrapper = menuWrapperRef.current;
    wrapper?.querySelector<HTMLElement>("[role='menuitem']")?.focus();

    function closeMenu(event: MouseEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (event instanceof MouseEvent && wrapper?.contains(event.target as Node)) return;
      setShowMenu(false);
      if (event instanceof KeyboardEvent) menuTriggerRef.current?.focus();
    }

    window.addEventListener("mousedown", closeMenu);
    window.addEventListener("keydown", closeMenu);
    return () => {
      window.removeEventListener("mousedown", closeMenu);
      window.removeEventListener("keydown", closeMenu);
    };
  }, [showMenu]);

  return (
    <article className={`delivery-card ${delivery.status === "cancelled" ? "cancelled" : ""}`}>
      <div className="card-topline">
        <span className={`type-badge type-${delivery.type}`}>{deliveryTypeLabels[delivery.type]}</span>
        {isAdmin && (
          <div className="card-menu-wrapper" ref={menuWrapperRef}>
            <button
              className="card-menu-button"
              ref={menuTriggerRef}
              type="button"
              aria-label={`Ações para ${delivery.title}`}
              aria-expanded={showMenu}
              aria-haspopup="menu"
              onClick={() => setShowMenu((current) => !current)}
            >
              <MoreHorizontal aria-hidden="true" />
            </button>
            {showMenu && (
              <div className="card-menu" role="menu">
                <button role="menuitem" type="button" onClick={() => { setShowMenu(false); onEdit(delivery); }}>
                  <Pencil aria-hidden="true" /> Editar
                </button>
                <button role="menuitem" className="danger-action" type="button" onClick={() => { setShowMenu(false); onDelete(delivery); }}>
                  <Trash2 aria-hidden="true" /> Remover
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <h3>{delivery.title}</h3>
      <p>{delivery.description || "Sem descrição adicional."}</p>

      <div className={`deadline deadline-${tone}`}>
        <span><CalendarClock aria-hidden="true" /> {deadline.date}</span>
        <strong>{deadline.time}</strong>
      </div>

      <div className="card-footer">
        <span>{delivery.updated_by_name} · {formatRelativeDate(delivery.updated_at)}</span>
        {delivery.source_url && (
          <a href={delivery.source_url} target="_blank" rel="noreferrer">
            Fonte <ExternalLink aria-hidden="true" />
          </a>
        )}
      </div>
      {delivery.status === "cancelled" && <span className="cancelled-label">Cancelada</span>}
    </article>
  );
}
