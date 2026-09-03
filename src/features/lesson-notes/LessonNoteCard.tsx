import { BookOpenText, Clock3, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { LessonNoteWithSubjectAndImages } from "../../lib/database.types";
import { formatDeadline } from "../../lib/date";
import { plainTextExcerpt } from "./lesson-note.utils";

export function LessonNoteCard({ note, isAdmin, onDelete }: { note: LessonNoteWithSubjectAndImages; isAdmin: boolean; onDelete: (note: LessonNoteWithSubjectAndImages) => void }) {
  const occurred = formatDeadline(note.occurred_at);
  return (
    <article className="delivery-card lesson-note-card">
      <div className="card-topline">
        <span className="type-badge type-note"><BookOpenText aria-hidden="true" /> Anotação</span>
        {isAdmin && <span className="lesson-note-card-actions"><Link to={`/subjects/${note.subject_id}/notes/${note.id}/edit`} aria-label={`Editar ${note.title}`}><Pencil aria-hidden="true" /></Link><button type="button" onClick={() => onDelete(note)} aria-label={`Remover ${note.title}`}><Trash2 aria-hidden="true" /></button></span>}
      </div>
      <h3><Link to={`/subjects/${note.subject_id}/notes/${note.id}`}>{note.title}</Link></h3>
      <p>{plainTextExcerpt(note.content) || "Conteúdo da aula"}</p>
      <div className="lesson-note-moment"><Clock3 aria-hidden="true" /><span>Aula em {occurred.date}</span><strong>{occurred.time}</strong></div>
      <div className="card-footer"><span>{note.updated_by_name}</span><Link to={`/subjects/${note.subject_id}/notes/${note.id}`}>Ler anotação <MoreHorizontal aria-hidden="true" /></Link></div>
    </article>
  );
}
