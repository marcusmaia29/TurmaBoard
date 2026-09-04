import { CalendarClock, ExternalLink, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { DeliveryWithSubject } from "../../lib/database.types";
import { formatDeadline, formatRelativeDate, getDeadlineTone } from "../../lib/date";
import { Menu } from "../../shared/Menu";
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
  const deadline = formatDeadline(delivery.due_at);
  const tone = getDeadlineTone(delivery.due_at);

  return (
    <article className={`delivery-card ${delivery.status === "cancelled" ? "cancelled" : ""}`}>
      <div className="card-topline">
        <span className={`type-badge type-${delivery.type}`}>{deliveryTypeLabels[delivery.type]}</span>
        {isAdmin && (
          <Menu
            label={`Ações para ${delivery.title}`}
            triggerClassName="card-menu-button"
            triggerContent={<MoreHorizontal aria-hidden="true" />}
            panelClassName="menu-panel"
            panelRole="menu"
          >
            {(close) => (
              <>
                <button role="menuitem" type="button" onClick={() => { close(); onEdit(delivery); }}>
                  <Pencil aria-hidden="true" /> Editar
                </button>
                <button role="menuitem" className="danger-action" type="button" onClick={() => { close(); onDelete(delivery); }}>
                  <Trash2 aria-hidden="true" /> Remover
                </button>
              </>
            )}
          </Menu>
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
