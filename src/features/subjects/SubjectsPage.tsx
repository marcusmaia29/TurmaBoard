import { useState, type CSSProperties, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, ArchiveRestore, ChevronDown, ChevronUp, ExternalLink, Link2, Plus, Save, Trash2 } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { queryKeys } from "../../lib/queryKeys";
import type { SubjectLink, SubjectWithLinks } from "../../lib/database.types";
import { PageHeader } from "../../shared/PageHeader";
import { EmptyState, ErrorState, LoadingSkeleton } from "../../shared/feedback";
import { useToast } from "../../shared/ToastContext";
import { ConfirmDialog } from "../../shared/ConfirmDialog";
import { SubjectDialog } from "./SubjectDialog";
import {
  archiveSubject,
  createSubject,
  createSubjectLink,
  deleteSubjectLink,
  fetchAdminSubjects,
  fetchSubjects,
  reorderSubjects,
  restoreSubject,
  updateSubject,
  type SubjectInput,
} from "./subject.service";

interface SubjectFormState {
  name: string;
  code: string;
  color: string;
  notes: string;
  officialUrl: string;
  platformUrl: string;
  repositoryUrl: string;
}

function toFormState(subject: SubjectWithLinks): SubjectFormState {
  return {
    name: subject.name,
    code: subject.code,
    color: subject.color,
    notes: subject.notes,
    officialUrl: subject.official_url ?? "",
    platformUrl: subject.platform_url ?? "",
    repositoryUrl: subject.repository_url ?? "",
  };
}

export default function SubjectsPage() {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: isAdmin ? queryKeys.adminSubjects : queryKeys.subjects,
    queryFn: isAdmin ? fetchAdminSubjects : fetchSubjects,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SubjectFormState | null>(null);
  const [newLink, setNewLink] = useState({ label: "", url: "" });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [pendingArchive, setPendingArchive] = useState<SubjectWithLinks | null>(null);
  const [pendingLink, setPendingLink] = useState<SubjectLink | null>(null);

  const subjects = query.data ?? [];
  const activeSubjects = subjects.filter((subject) => !subject.archived_at);
  const archivedSubjects = subjects.filter((subject) => subject.archived_at);
  const selectedSubject = activeSubjects.find((subject) => subject.id === selectedId) ?? activeSubjects[0] ?? null;
  const form = selectedSubject ? draft ?? toFormState(selectedSubject) : null;

  async function refreshSubjects() {
    await queryClient.invalidateQueries({ queryKey: ["subjects"] });
    await queryClient.invalidateQueries({ queryKey: ["deliveries"] });
    await queryClient.invalidateQueries({ queryKey: ["history"] });
  }

  const createMutation = useMutation({
    mutationFn: (input: SubjectInput) => createSubject(input, activeSubjects.length + 1),
    onSuccess: async () => {
      setShowCreateDialog(false);
      await refreshSubjects();
      showToast("Disciplina adicionada.");
    },
    onError: () => showToast("Não foi possível adicionar a disciplina. Confira se a sigla já existe.", "error"),
  });

  const saveMutation = useMutation({
    mutationFn: async (input: SubjectInput) => {
      if (!selectedSubject) return;
      await updateSubject(selectedSubject.id, input);
    },
    onSuccess: async () => {
      setDraft(null);
      await refreshSubjects();
      showToast("Disciplina atualizada.");
    },
    onError: () => showToast("Não foi possível atualizar a disciplina.", "error"),
  });

  const archiveMutation = useMutation({
    mutationFn: archiveSubject,
    onSuccess: async () => {
      setPendingArchive(null);
      setSelectedId(null);
      setDraft(null);
      await refreshSubjects();
      showToast("Disciplina arquivada.");
    },
    onError: () => showToast("Não foi possível arquivar a disciplina.", "error"),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreSubject(id, activeSubjects.length + 1),
    onSuccess: async () => {
      await refreshSubjects();
      showToast("Disciplina restaurada.");
    },
    onError: () => showToast("Não foi possível restaurar a disciplina.", "error"),
  });

  const reorderMutation = useMutation({
    mutationFn: reorderSubjects,
    onSuccess: async () => {
      await refreshSubjects();
      showToast("Ordem das disciplinas atualizada.");
    },
    onError: () => showToast("Não foi possível alterar a ordem.", "error"),
  });

  const addLinkMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSubject) return;
      await createSubjectLink(selectedSubject.id, newLink.label.trim(), newLink.url.trim(), selectedSubject.subject_links.length + 1);
    },
    onSuccess: async () => {
      setNewLink({ label: "", url: "" });
      await refreshSubjects();
      showToast("Link adicionado.");
    },
    onError: () => showToast("Não foi possível adicionar o link.", "error"),
  });

  const deleteLinkMutation = useMutation({
    mutationFn: deleteSubjectLink,
    onSuccess: async () => {
      setPendingLink(null);
      await refreshSubjects();
      showToast("Link removido.");
    },
    onError: () => showToast("Não foi possível remover o link.", "error"),
  });

  function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    saveMutation.mutate({
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      color: form.color,
      notes: form.notes.trim(),
      official_url: form.officialUrl.trim() || null,
      platform_url: form.platformUrl.trim() || null,
      repository_url: form.repositoryUrl.trim() || null,
    });
  }

  function moveSubject(subjectId: string, direction: -1 | 1) {
    const currentIndex = activeSubjects.findIndex((subject) => subject.id === subjectId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= activeSubjects.length) return;
    const reordered = activeSubjects.map((subject) => subject.id);
    [reordered[currentIndex], reordered[nextIndex]] = [reordered[nextIndex], reordered[currentIndex]];
    reorderMutation.mutate(reordered);
  }

  return (
    <div>
      <PageHeader
        title="Disciplinas e referências"
        description="Links oficiais e anotações práticas para consultar durante o semestre."
        action={isAdmin ? (
          <button className="primary-button" type="button" onClick={() => setShowCreateDialog(true)}>
            <Plus aria-hidden="true" /> Nova disciplina
          </button>
        ) : undefined}
      />

      {query.isLoading && <LoadingSkeleton columns={3} />}
      {query.isError && <ErrorState onRetry={() => void query.refetch()} />}
      {!query.isLoading && !query.isError && !selectedSubject && (
        <EmptyState
          title="Nenhuma disciplina ativa"
          description={isAdmin ? "Use “Nova disciplina” para montar o quadro da turma." : "As disciplinas serão publicadas em breve."}
        />
      )}

      {selectedSubject && form && (
        <div className="subjects-layout">
          <aside className="subject-selector" aria-label="Selecionar disciplina">
            {activeSubjects.map((subject, index) => (
              <div className="subject-selector-item" key={subject.id}>
                <button
                  className={`subject-select-button${subject.id === selectedSubject.id ? " active" : ""}`}
                  type="button"
                  onClick={() => { setSelectedId(subject.id); setDraft(null); }}
                >
                  <span style={{ "--subject-color": subject.color } as CSSProperties}>{subject.code}</span>
                  <span><strong>{subject.name}</strong><small>{subject.subject_links.length} links salvos</small></span>
                </button>
                {isAdmin && (
                  <span className="subject-order-actions">
                    <button type="button" disabled={index === 0 || reorderMutation.isPending} onClick={() => moveSubject(subject.id, -1)} aria-label={`Mover ${subject.name} para cima`}><ChevronUp aria-hidden="true" /></button>
                    <button type="button" disabled={index === activeSubjects.length - 1 || reorderMutation.isPending} onClick={() => moveSubject(subject.id, 1)} aria-label={`Mover ${subject.name} para baixo`}><ChevronDown aria-hidden="true" /></button>
                  </span>
                )}
              </div>
            ))}
          </aside>

          <section className="subject-details">
            <form onSubmit={handleSave}>
              <div className="subject-title-row">
                <span className="large-subject-code" style={{ "--subject-color": selectedSubject.color } as CSSProperties}>{selectedSubject.code}</span>
                <div><h2>{selectedSubject.name}</h2><p>Atualizada em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(selectedSubject.updated_at))}</p></div>
                {isAdmin && (
                  <div className="subject-main-actions">
                    <button className="secondary-button danger-text" type="button" onClick={() => setPendingArchive(selectedSubject)}><Archive aria-hidden="true" /> Arquivar</button>
                    <button className="primary-button" type="submit" disabled={saveMutation.isPending}><Save aria-hidden="true" /> {saveMutation.isPending ? "Salvando…" : "Salvar"}</button>
                  </div>
                )}
              </div>

              {isAdmin ? (
                <div className="subject-form-grid">
                  <label className="field"><span>Nome</span><input required maxLength={120} value={form.name} onChange={(event) => setDraft({ ...form, name: event.target.value })} /></label>
                  <label className="field"><span>Sigla</span><input required maxLength={8} value={form.code} onChange={(event) => setDraft({ ...form, code: event.target.value })} /></label>
                  <label className="field"><span>Cor</span><input type="color" value={form.color} onChange={(event) => setDraft({ ...form, color: event.target.value })} /></label>
                  <label className="field field-full"><span>Anotações</span><textarea rows={5} maxLength={1200} value={form.notes} onChange={(event) => setDraft({ ...form, notes: event.target.value })} /></label>
                  <label className="field field-full"><span>Site oficial</span><input type="url" value={form.officialUrl} onChange={(event) => setDraft({ ...form, officialUrl: event.target.value })} /></label>
                  <label className="field field-full"><span>Plataforma acadêmica</span><input type="url" value={form.platformUrl} onChange={(event) => setDraft({ ...form, platformUrl: event.target.value })} /></label>
                  <label className="field field-full"><span>Repositório</span><input type="url" value={form.repositoryUrl} onChange={(event) => setDraft({ ...form, repositoryUrl: event.target.value })} /></label>
                </div>
              ) : (
                <div className="subject-public-content">
                  <p>{selectedSubject.notes || "Nenhuma anotação compartilhada."}</p>
                  <div className="official-links">
                    {[["Site oficial", selectedSubject.official_url], ["Plataforma acadêmica", selectedSubject.platform_url], ["Repositório", selectedSubject.repository_url]].map(([label, url]) => url && (
                      <a href={url} target="_blank" rel="noreferrer" key={label}><Link2 aria-hidden="true" /><span><strong>{label}</strong><small>{url}</small></span><ExternalLink aria-hidden="true" /></a>
                    ))}
                  </div>
                </div>
              )}
            </form>

            <div className="shared-links-section">
              <div><h3>Links importantes</h3><p>Referências adicionais compartilhadas com a turma.</p></div>
              <div className="shared-links-list">
                {selectedSubject.subject_links.map((link) => (
                  <div className="shared-link" key={link.id}>
                    <a href={link.url} target="_blank" rel="noreferrer"><Link2 aria-hidden="true" /><span><strong>{link.label}</strong><small>{link.url}</small></span></a>
                    {isAdmin && <button className="icon-button danger" type="button" disabled={deleteLinkMutation.isPending} onClick={() => setPendingLink(link)} aria-label={`Remover ${link.label}`}><Trash2 aria-hidden="true" /></button>}
                  </div>
                ))}
                {!selectedSubject.subject_links.length && <EmptyState title="Nenhum link adicional" description="Os links oficiais continuam disponíveis acima." />}
              </div>
              {isAdmin && (
                <form className="new-link-form" onSubmit={(event) => { event.preventDefault(); addLinkMutation.mutate(); }}>
                  <label className="field"><span>Nome do link</span><input required maxLength={100} value={newLink.label} onChange={(event) => setNewLink({ ...newLink, label: event.target.value })} placeholder="Ex.: Materiais da aula" /></label>
                  <label className="field"><span>Endereço</span><input required type="url" value={newLink.url} onChange={(event) => setNewLink({ ...newLink, url: event.target.value })} placeholder="https://..." /></label>
                  <button className="secondary-button" type="submit" disabled={addLinkMutation.isPending}><Plus aria-hidden="true" /> {addLinkMutation.isPending ? "Adicionando…" : "Adicionar"}</button>
                </form>
              )}
            </div>
          </section>
        </div>
      )}

      {isAdmin && archivedSubjects.length > 0 && (
        <section className="archived-subjects" aria-labelledby="archived-subjects-title">
          <div><h2 id="archived-subjects-title">Disciplinas arquivadas</h2><p>Restaurar devolve a disciplina ao final do quadro.</p></div>
          <div>
            {archivedSubjects.map((subject) => (
              <span key={subject.id}><strong>{subject.code}</strong> {subject.name}<button className="secondary-button" type="button" disabled={restoreMutation.isPending} onClick={() => restoreMutation.mutate(subject.id)}><ArchiveRestore aria-hidden="true" /> Restaurar</button></span>
            ))}
          </div>
        </section>
      )}

      {showCreateDialog && <SubjectDialog isSaving={createMutation.isPending} onClose={() => setShowCreateDialog(false)} onSubmit={(input) => createMutation.mutateAsync(input)} />}
      {pendingArchive && (
        <ConfirmDialog
          title={`Arquivar “${pendingArchive.name}”?`}
          description="A disciplina e suas entregas deixam de aparecer para visitantes, mas o histórico e os dados permanecem preservados."
          confirmLabel="Arquivar disciplina"
          isPending={archiveMutation.isPending}
          onCancel={() => setPendingArchive(null)}
          onConfirm={() => archiveMutation.mutate(pendingArchive.id)}
        />
      )}
      {pendingLink && (
        <ConfirmDialog
          title={`Remover “${pendingLink.label}”?`}
          description="O link será removido da disciplina e a ação ficará registrada no histórico."
          confirmLabel="Remover link"
          isPending={deleteLinkMutation.isPending}
          onCancel={() => setPendingLink(null)}
          onConfirm={() => deleteLinkMutation.mutate(pendingLink.id)}
        />
      )}
    </div>
  );
}
