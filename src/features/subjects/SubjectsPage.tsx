import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Link2, Plus, Save, Trash2 } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { queryKeys } from "../../lib/queryKeys";
import type { SubjectWithLinks } from "../../lib/database.types";
import { PageHeader } from "../../shared/PageHeader";
import { EmptyState, ErrorState, LoadingSkeleton } from "../../shared/feedback";
import { useToast } from "../../shared/ToastContext";
import { createSubjectLink, deleteSubjectLink, fetchSubjects, updateSubject, type SubjectInput } from "./subject.service";

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
  const query = useQuery({ queryKey: queryKeys.subjects, queryFn: fetchSubjects });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SubjectFormState | null>(null);
  const [newLink, setNewLink] = useState({ label: "", url: "" });

  const selectedSubject = query.data?.find((subject) => subject.id === selectedId) ?? query.data?.[0] ?? null;
  const form = selectedSubject ? draft ?? toFormState(selectedSubject) : null;

  const saveMutation = useMutation({
    mutationFn: async (input: SubjectInput) => {
      if (!selectedSubject) return;
      await updateSubject(selectedSubject.id, input);
    },
    onSuccess: async () => {
      setDraft(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.subjects });
      showToast("Disciplina atualizada.");
    },
    onError: () => showToast("Não foi possível atualizar a disciplina.", "error"),
  });

  const addLinkMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSubject) return;
      await createSubjectLink(selectedSubject.id, newLink.label.trim(), newLink.url.trim(), selectedSubject.subject_links.length + 1);
    },
    onSuccess: async () => {
      setNewLink({ label: "", url: "" });
      await queryClient.invalidateQueries({ queryKey: queryKeys.subjects });
      showToast("Link adicionado.");
    },
    onError: () => showToast("Não foi possível adicionar o link.", "error"),
  });

  const deleteLinkMutation = useMutation({
    mutationFn: deleteSubjectLink,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.subjects });
      showToast("Link removido.");
    },
    onError: () => showToast("Não foi possível remover o link.", "error"),
  });

  function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    saveMutation.mutate({
      name: form.name.trim(), code: form.code.trim().toUpperCase(), color: form.color, notes: form.notes.trim(),
      official_url: form.officialUrl.trim() || null,
      platform_url: form.platformUrl.trim() || null,
      repository_url: form.repositoryUrl.trim() || null,
    });
  }

  return (
    <div>
      <PageHeader title="Disciplinas e referências" description="Links oficiais e anotações práticas para consultar durante o semestre." />
      {query.isLoading && <LoadingSkeleton columns={3} />}
      {query.isError && <ErrorState onRetry={() => void query.refetch()} />}
      {!query.isLoading && !query.isError && !selectedSubject && <EmptyState title="Nenhuma disciplina" description="Cadastre as disciplinas diretamente no Supabase para começar." />}
      {selectedSubject && form && (
        <div className="subjects-layout">
          <aside className="subject-selector" aria-label="Selecionar disciplina">
            {query.data?.map((subject) => (
              <button className={subject.id === selectedSubject.id ? "active" : ""} type="button" onClick={() => { setSelectedId(subject.id); setDraft(null); }} key={subject.id}>
                <span style={{ backgroundColor: subject.color }}>{subject.code}</span>
                <span><strong>{subject.name}</strong><small>{subject.subject_links.length} links salvos</small></span>
              </button>
            ))}
          </aside>

          <section className="subject-details">
            <form onSubmit={handleSave}>
              <div className="subject-title-row">
                <span className="large-subject-code" style={{ backgroundColor: selectedSubject.color }}>{selectedSubject.code}</span>
                <div><h2>{selectedSubject.name}</h2><p>Atualizada em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(selectedSubject.updated_at))}</p></div>
                {isAdmin && <button className="primary-button" type="submit" disabled={saveMutation.isPending}><Save aria-hidden="true" /> Salvar</button>}
              </div>

              {isAdmin ? (
                <div className="subject-form-grid">
                  <label className="field"><span>Nome</span><input required value={form.name} onChange={(event) => setDraft({ ...form, name: event.target.value })} /></label>
                  <label className="field"><span>Sigla</span><input required maxLength={5} value={form.code} onChange={(event) => setDraft({ ...form, code: event.target.value })} /></label>
                  <label className="field"><span>Cor</span><input type="color" value={form.color} onChange={(event) => setDraft({ ...form, color: event.target.value })} /></label>
                  <label className="field field-full"><span>Anotações</span><textarea rows={5} value={form.notes} onChange={(event) => setDraft({ ...form, notes: event.target.value })} /></label>
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
                    {isAdmin && <button className="icon-button danger" type="button" onClick={() => deleteLinkMutation.mutate(link.id)} aria-label={`Remover ${link.label}`}><Trash2 aria-hidden="true" /></button>}
                  </div>
                ))}
                {!selectedSubject.subject_links.length && <EmptyState title="Nenhum link adicional" description="Os links oficiais continuam disponíveis acima." />}
              </div>
              {isAdmin && (
                <form className="new-link-form" onSubmit={(event) => { event.preventDefault(); addLinkMutation.mutate(); }}>
                  <label className="field"><span>Nome do link</span><input required value={newLink.label} onChange={(event) => setNewLink({ ...newLink, label: event.target.value })} placeholder="Ex.: Materiais da aula" /></label>
                  <label className="field"><span>Endereço</span><input required type="url" value={newLink.url} onChange={(event) => setNewLink({ ...newLink, url: event.target.value })} placeholder="https://..." /></label>
                  <button className="secondary-button" type="submit" disabled={addLinkMutation.isPending}><Plus aria-hidden="true" /> Adicionar</button>
                </form>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
