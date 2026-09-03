import { Dialog } from "./Dialog";

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirmar",
  isPending = false,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  isPending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog title={title} description={description} isBusy={isPending} className="confirm-dialog" onClose={onCancel}>
      <div className="dialog-actions confirm-actions">
        <button className="secondary-button" type="button" onClick={onCancel} disabled={isPending}>Cancelar</button>
        <button className="danger-button" type="button" onClick={onConfirm} disabled={isPending} data-autofocus>
          {isPending ? "Aguarde…" : confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
