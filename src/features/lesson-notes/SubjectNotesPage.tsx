import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpenText, CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { fetchSubjects } from "../subjects/subject.service";
import { queryKeys } from "../../lib/queryKeys";
import { EmptyState, ErrorState, LoadingSkeleton } from "../../shared/feedback";
import { ConfirmDialog } from "../../shared/ConfirmDialog";
import { PageHeader } from "../../shared/PageHeader";
import { useToast } from "../../shared/ToastContext";
import { formatDeadline } from "../../lib/date";
import type { LessonNoteWithSubjectAndImages } from "../../lib/database.types";
import { fetchLessonNotes, softDeleteLessonNote } from "./lesson-note.service";
import { groupNotesByMonth } from "./lesson-note.utils";
import { LessonNoteContent } from "./LessonNoteContent";
import { LessonNoteGallery } from "./LessonNoteGallery";

export default function SubjectNotesPage() {
  const { subjectId = "", noteId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const order = searchParams.get("order") === "asc" ? "asc" : "desc";
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [pendingDelete, setPendingDelete] = useState<LessonNoteWithSubjectAndImages | null>(null);
  const subjectsQuery = useQuery({ queryKey: queryKeys.subjects, queryFn: fetchSubjects });
  const notesQuery = useQuery({ queryKey: queryKeys.lessonNotes(undefined, undefined, subjectId, order), queryFn: () => fetchLessonNotes({ subjectId, order }), enabled: Boolean(subjectId) });
  const notes = useMemo(() => notesQuery.data ?? [], [notesQuery.data]);
  const selected = notes.find((note) => note.id === noteId) ?? (!noteId ? notes[0] : null);
  const selectedSubject = subjectsQuery.data?.find((subject) => subject.id === subjectId);
  const groups = useMemo(() => groupNotesByMonth(notes), [notes]);
  const removeMutation = useMutation({
    mutationFn: softDeleteLessonNote,
    onSuccess: async () => {
      setPendingDelete(null);
      await queryClient.invalidateQueries({ queryKey: ["lesson-notes"] });
      await queryClient.invalidateQueries({ queryKey: ["history"] });
      navigate(`/subjects/${subjectId}/notes?order=${order}`);
      showToast("Anotação removida.");
    },
    onError: () => showToast("Não foi possível remover a anotação.", "error"),
  });

  if (subjectsQuery.isLoading || notesQuery.isLoading) return <LoadingSkeleton columns={2} />;
  if (subjectsQuery.isError || notesQuery.isError) return <ErrorState onRetry={() => { void subjectsQuery.refetch(); void notesQuery.refetch(); }} />;
  if (!selectedSubject) return <ErrorState message="A disciplina não existe ou foi arquivada." />;

  return (
    <section className="subject-notes-page">
      <PageHeader title="Anotações de aula" description={`Consulte o histórico compartilhado de ${selectedSubject.name}.`} action={isAdmin ? <Link className="primary-button" to={`/subjects/${subjectId}/notes/new`}><Plus aria-hidden="true" /> Nova anotação</Link> : undefined} />
      <div className="subject-notes-layout">
        <aside className="notes-subjects" aria-label="Selecionar disciplina">
          {subjectsQuery.data?.map((subject) => <Link className={subject.id === subjectId ? "active" : ""} to={`/subjects/${subject.id}/notes?order=${order}`} key={subject.id}><span style={{ "--subject-color": subject.color } as React.CSSProperties}>{subject.code}</span><strong>{subject.name}</strong></Link>)}
        </aside>
        <section className={`notes-workspace${noteId && selected ? " has-explicit-selection" : ""}`}>
          <div className="notes-index">
            <div className="subject-view-tabs"><Link to="/subjects">Visão geral</Link><span className="active">Anotações de aula</span></div>
            <div className="notes-order" aria-label="Ordenar anotações"><button className={order === "asc" ? "active" : ""} onClick={() => setSearchParams({ order: "asc" })} type="button">Cronológica</button><button className={order === "desc" ? "active" : ""} onClick={() => setSearchParams({ order: "desc" })} type="button">Mais recentes</button></div>
            {groups.length ? groups.map((group) => <section className="notes-month" key={group.key}><h2>{group.label}</h2>{group.notes.map((note) => { const date = formatDeadline(note.occurred_at); return <Link className={note.id === selected?.id ? "active" : ""} to={`/subjects/${subjectId}/notes/${note.id}?order=${order}`} key={note.id}><time>{date.date} · {date.time}</time><strong>{note.title}</strong><span><BookOpenText aria-hidden="true" /> {note.content_format === "markdown" ? "Markdown" : "LaTeX"}{note.images.length ? ` · ${note.images.length} ${note.images.length === 1 ? "imagem" : "imagens"}` : ""}</span></Link>; })}</section>) : <EmptyState title="Nenhuma anotação" description={isAdmin ? "Registre a primeira aula desta disciplina." : "As anotações desta disciplina serão publicadas aqui."} />}
          </div>
          <article className="note-reader">
            {selected ? <>
              <Link className="mobile-notes-back" to={`/subjects/${subjectId}/notes?order=${order}`}><ArrowLeft aria-hidden="true" /> Voltar às aulas</Link>
              <header><div><span className="note-format"><BookOpenText aria-hidden="true" /> {selected.content_format === "markdown" ? "Markdown" : "LaTeX"}</span><h2>{selected.title}</h2><p><CalendarDays aria-hidden="true" /> {formatDeadline(selected.occurred_at).date}, às {formatDeadline(selected.occurred_at).time}</p></div>{isAdmin && <div className="note-reader-actions"><Link className="secondary-button" to={`/subjects/${subjectId}/notes/${selected.id}/edit`}><Pencil aria-hidden="true" /> Editar</Link><button className="icon-button danger" type="button" onClick={() => setPendingDelete(selected)} aria-label="Remover anotação"><Trash2 aria-hidden="true" /></button></div>}</header>
              <div className="note-reader-content"><LessonNoteContent format={selected.content_format} content={selected.content} /><LessonNoteGallery images={selected.images} /></div>
              <footer>Atualizada por {selected.updated_by_name} em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(selected.updated_at))}</footer>
            </> : <EmptyState title={noteId ? "Anotação não encontrada" : "Selecione uma aula"} description={noteId ? "Ela pode ter sido removida ou estar em outra disciplina." : "Escolha uma anotação no índice para começar a leitura."} />}
          </article>
        </section>
      </div>
      {pendingDelete && <ConfirmDialog title={`Remover “${pendingDelete.title}”?`} description="A anotação deixará de aparecer para a turma e a ação ficará no histórico." confirmLabel="Remover anotação" isPending={removeMutation.isPending} onCancel={() => setPendingDelete(null)} onConfirm={() => removeMutation.mutate(pendingDelete)} />}
    </section>
  );
}
