import { useState, type FormEvent } from "react";
import { Dialog } from "../../shared/Dialog";
import type { SubjectInput } from "./subject.service";

const initialSubject: SubjectInput = {
  name: "",
  code: "",
  color: "#3578E5",
  notes: "",
  official_url: null,
  platform_url: null,
  repository_url: null,
};

export function SubjectDialog({
  isSaving,
  onClose,
  onSubmit,
}: {
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (input: SubjectInput) => Promise<void>;
}) {
  const [form, setForm] = useState(initialSubject);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onSubmit({
      ...form,
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      notes: form.notes?.trim() ?? "",
      official_url: form.official_url?.trim() || null,
      platform_url: form.platform_url?.trim() || null,
      repository_url: form.repository_url?.trim() || null,
    });
  }

  return (
    <Dialog
      title="Nova disciplina"
      description="Cadastre uma disciplina para disponibilizá-la no quadro e no calendário."
      isBusy={isSaving}
      onClose={onClose}
    >
      <form className="subject-form-grid" onSubmit={(event) => void handleSubmit(event)}>
        <label className="field">
          <span>Nome</span>
          <input data-autofocus required maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <label className="field">
          <span>Sigla</span>
          <input required maxLength={8} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
        </label>
        <label className="field">
          <span>Cor</span>
          <input type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} />
        </label>
        <label className="field field-full">
          <span>Anotações</span>
          <textarea rows={4} maxLength={1200} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
        </label>
        <label className="field field-full">
          <span>Site oficial</span>
          <input type="url" value={form.official_url ?? ""} onChange={(event) => setForm({ ...form, official_url: event.target.value })} placeholder="https://..." />
        </label>
        <label className="field field-full">
          <span>Plataforma acadêmica</span>
          <input type="url" value={form.platform_url ?? ""} onChange={(event) => setForm({ ...form, platform_url: event.target.value })} placeholder="https://..." />
        </label>
        <label className="field field-full">
          <span>Repositório</span>
          <input type="url" value={form.repository_url ?? ""} onChange={(event) => setForm({ ...form, repository_url: event.target.value })} placeholder="https://..." />
        </label>
        <div className="dialog-actions field-full">
          <button className="secondary-button" type="button" onClick={onClose} disabled={isSaving}>Cancelar</button>
          <button className="primary-button" type="submit" disabled={isSaving}>
            {isSaving ? "Adicionando…" : "Adicionar disciplina"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
