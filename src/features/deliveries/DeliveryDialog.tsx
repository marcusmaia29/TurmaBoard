import { useEffect, useId, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type { DeliveryStatus, DeliveryType, DeliveryWithSubject, SubjectWithLinks } from "../../lib/database.types";
import { fromFormDateTime, toDateKey, toFormDateTime } from "../../lib/date";
import { deliveryTypeLabels, deliveryTypes } from "./delivery.constants";
import type { DeliveryInput } from "./delivery.service";

interface FormState {
  title: string;
  subjectId: string;
  type: DeliveryType;
  date: string;
  time: string;
  description: string;
  sourceUrl: string;
  status: DeliveryStatus;
}

function initialFormState(delivery: DeliveryWithSubject | null, subjects: SubjectWithLinks[]): FormState {
  if (delivery) {
    const dateTime = toFormDateTime(delivery.due_at);
    return {
      title: delivery.title,
      subjectId: delivery.subject_id,
      type: delivery.type,
      date: dateTime.date,
      time: dateTime.time,
      description: delivery.description,
      sourceUrl: delivery.source_url ?? "",
      status: delivery.status,
    };
  }
  return {
    title: "",
    subjectId: subjects[0]?.id ?? "",
    type: "activity",
    date: toDateKey(new Date()),
    time: "23:59",
    description: "",
    sourceUrl: "",
    status: "active",
  };
}

export function DeliveryDialog({
  delivery,
  subjects,
  isSaving,
  onClose,
  onSubmit,
}: {
  delivery: DeliveryWithSubject | null;
  subjects: SubjectWithLinks[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (input: DeliveryInput) => Promise<void>;
}) {
  const titleId = useId();
  const [form, setForm] = useState(() => initialFormState(delivery, subjects));

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSaving, onClose]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onSubmit({
      title: form.title.trim(),
      subject_id: form.subjectId,
      type: form.type,
      due_at: fromFormDateTime(form.date, form.time),
      description: form.description.trim(),
      source_url: form.sourceUrl.trim() || null,
      status: form.status,
    });
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSaving) onClose(); }}>
      <section className="dialog-panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="dialog-header">
          <div>
            <h2 id={titleId}>{delivery ? "Editar entrega" : "Nova entrega"}</h2>
            <p>As informações serão compartilhadas com toda a turma.</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} disabled={isSaving} aria-label="Fechar">
            <X aria-hidden="true" />
          </button>
        </div>

        <form className="delivery-form" onSubmit={(event) => void handleSubmit(event)}>
          <label className="field field-full">
            <span>Título</span>
            <input autoFocus maxLength={160} required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Ex.: Quiz 03 — Classificação" />
          </label>
          <label className="field">
            <span>Disciplina</span>
            <select required value={form.subjectId} onChange={(event) => setForm({ ...form, subjectId: event.target.value })}>
              {subjects.map((subject) => <option value={subject.id} key={subject.id}>{subject.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Tipo</span>
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as DeliveryType })}>
              {deliveryTypes.map((type) => <option value={type} key={type}>{deliveryTypeLabels[type]}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Data</span>
            <input type="date" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </label>
          <label className="field">
            <span>Horário</span>
            <input type="time" required value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} />
          </label>
          <label className="field field-full">
            <span>Descrição</span>
            <textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Contexto necessário para a turma" />
          </label>
          <label className="field field-full">
            <span>Link ou fonte oficial</span>
            <input type="url" value={form.sourceUrl} onChange={(event) => setForm({ ...form, sourceUrl: event.target.value })} placeholder="https://..." />
          </label>
          {delivery && (
            <label className="field field-full">
              <span>Situação</span>
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as DeliveryStatus })}>
                <option value="active">Ativa</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </label>
          )}
          <div className="dialog-actions field-full">
            <button className="secondary-button" type="button" onClick={onClose} disabled={isSaving}>Cancelar</button>
            <button className="primary-button" type="submit" disabled={isSaving || !form.subjectId}>
              {isSaving ? "Salvando…" : delivery ? "Salvar alterações" : "Adicionar entrega"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
