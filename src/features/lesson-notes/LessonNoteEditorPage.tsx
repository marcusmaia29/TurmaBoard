import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowLeft, ArrowUp, Eye, FileImage, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import type { LessonNoteFormat, LessonNoteImage } from "../../lib/database.types";
import { fromFormDateTime, toDateKey, toFormDateTime } from "../../lib/date";
import { queryKeys } from "../../lib/queryKeys";
import { ErrorState, LoadingSkeleton } from "../../shared/feedback";
import { PageHeader } from "../../shared/PageHeader";
import { useToast } from "../../shared/ToastContext";
import { useAuth } from "../auth/AuthContext";
import { fetchSubjects } from "../subjects/subject.service";
import { LessonNoteContent } from "./LessonNoteContent";
import { getLatexError } from "./lesson-note.render";
import {
  MAX_NOTE_IMAGES,
  createLessonNote,
  deleteLessonNoteImage,
  fetchLessonNote,
  getLessonNoteImageUrl,
  updateLessonNote,
  updateLessonNoteImages,
  uploadLessonNoteImage,
  validateImageFile,
} from "./lesson-note.service";

interface PendingImage { id: string; file: File; previewUrl: string; altText: string; caption: string; status: "ready" | "uploading" | "uploaded" | "error"; error?: string }

export default function LessonNoteEditorPage() {
  const { subjectId = "", noteId } = useParams();
  const editing = Boolean(noteId);
  const { isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const subjectsQuery = useQuery({ queryKey: queryKeys.subjects, queryFn: fetchSubjects });
  const noteQuery = useQuery({ queryKey: queryKeys.lessonNote(noteId ?? "new"), queryFn: () => fetchLessonNote(noteId!), enabled: editing });
  const initialForm = useMemo(() => {
    if (!noteQuery.data) return { title: "", subjectId, date: toDateKey(new Date()), time: "10:00", format: "markdown" as LessonNoteFormat, content: "" };
    const dateTime = toFormDateTime(noteQuery.data.occurred_at);
    return { title: noteQuery.data.title, subjectId: noteQuery.data.subject_id, date: dateTime.date, time: dateTime.time, format: noteQuery.data.content_format, content: noteQuery.data.content };
  }, [noteQuery.data, subjectId]);
  const [draft, setDraft] = useState<typeof initialForm | null>(null);
  const form = draft ?? initialForm;
  const [existingDraft, setExistingDraft] = useState<LessonNoteImage[] | null>(null);
  const existingImages = existingDraft ?? noteQuery.data?.images ?? [];
  const [removedImages, setRemovedImages] = useState<LessonNoteImage[]>([]);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const pendingImagesRef = useRef<PendingImage[]>([]);
  const savedNoteIdRef = useRef(noteId);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (!dirty) return;
    function guardLink(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!target || window.confirm("Sair sem salvar as alterações desta anotação?")) return;
      event.preventDefault();
      event.stopPropagation();
    }
    document.addEventListener("click", guardLink, true);
    return () => document.removeEventListener("click", guardLink, true);
  }, [dirty]);

  useEffect(() => { pendingImagesRef.current = pendingImages; }, [pendingImages]);
  useEffect(() => () => pendingImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl)), []);

  const latexError = useMemo(() => form.format === "latex" && form.content.trim() ? getLatexError(form.content) : null, [form.content, form.format]);
  const totalImages = existingImages.length + pendingImages.length;
  const validationMessage = !form.title.trim() ? "Informe o título da aula." : !form.content.trim() ? "Escreva o conteúdo da anotação." : latexError ? `LaTeX inválido: ${latexError}` : [...existingImages.map((image) => image.alt_text), ...pendingImages.map((image) => image.altText)].some((alt) => !alt.trim()) ? "Descreva todas as imagens no campo de texto alternativo." : null;

  function updateForm(patch: Partial<typeof form>) { setDraft((current) => ({ ...(current ?? form), ...patch })); setDirty(true); }
  function move<T>(items: T[], index: number, direction: -1 | 1): T[] { const next = [...items]; const target = index + direction; if (target < 0 || target >= items.length) return items; [next[index], next[target]] = [next[target], next[index]]; return next; }
  function addImages(files: FileList | null) {
    if (!files) return;
    const additions: PendingImage[] = [];
    for (const file of Array.from(files)) {
      if (totalImages + additions.length >= MAX_NOTE_IMAGES) { showToast("Cada anotação aceita até oito imagens.", "error"); break; }
      const error = validateImageFile(file);
      if (error) { showToast(`${file.name}: ${error}`, "error"); continue; }
      additions.push({ id: crypto.randomUUID(), file, previewUrl: URL.createObjectURL(file), altText: "", caption: "", status: "ready" });
    }
    if (additions.length) { setPendingImages((current) => [...current, ...additions]); setDirty(true); }
  }
  function cancel() {
    if (!dirty || window.confirm("Descartar as alterações desta anotação?")) navigate(`/subjects/${form.subjectId}/notes${noteId ? `/${noteId}` : ""}`);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (validationMessage) throw new Error(validationMessage);
      const input = { subject_id: form.subjectId, title: form.title.trim(), occurred_at: fromFormDateTime(form.date, form.time), content_format: form.format, content: form.content.trim() };
      let savedId = savedNoteIdRef.current;
      if (savedId) await updateLessonNote(savedId, input);
      else {
        savedId = await createLessonNote(input);
        savedNoteIdRef.current = savedId;
      }
      for (const image of removedImages) await deleteLessonNoteImage(image);
      await updateLessonNoteImages(existingImages);
      for (const [position, image] of pendingImages.entries()) {
        if (image.status === "uploaded") continue;
        setPendingImages((current) => current.map((item) => item.id === image.id ? { ...item, status: "uploading" } : item));
        try {
          await uploadLessonNoteImage(savedId, image.file, { altText: image.altText, caption: image.caption, position: existingImages.length + position });
          setPendingImages((current) => current.map((item) => item.id === image.id ? { ...item, status: "uploaded", error: undefined } : item));
        } catch (error) {
          const message = error instanceof Error ? error.message : "Falha no upload.";
          setPendingImages((current) => current.map((item) => item.id === image.id ? { ...item, status: "error", error: message } : item));
          throw new Error(`${image.file.name}: ${message}`, { cause: error });
        }
      }
      return savedId;
    },
    onSuccess: async (savedId) => {
      setDirty(false);
      await queryClient.invalidateQueries({ queryKey: ["lesson-notes"] });
      await queryClient.invalidateQueries({ queryKey: ["history"] });
      showToast(editing ? "Anotação atualizada." : "Anotação publicada.");
      navigate(`/subjects/${form.subjectId}/notes/${savedId}`);
    },
    onError: (error) => showToast(error.message || "Não foi possível salvar a anotação.", "error"),
  });

  if (authLoading || subjectsQuery.isLoading || (editing && noteQuery.isLoading)) return <LoadingSkeleton columns={2} />;
  if (!isAdmin) return <Navigate to={`/subjects/${subjectId}/notes${noteId ? `/${noteId}` : ""}`} replace />;
  if (subjectsQuery.isError || noteQuery.isError) return <ErrorState message="Não foi possível preparar o editor." />;

  return (
    <section className="note-editor-page">
      <PageHeader title={editing ? "Editar anotação" : "Nova anotação"} description="Registre o conteúdo essencial da aula para toda a turma." />
      <form onSubmit={(event: FormEvent) => { event.preventDefault(); saveMutation.mutate(); }}>
        <div className="note-editor-toolbar">
          <button type="button" className="secondary-button" onClick={cancel}><ArrowLeft aria-hidden="true" /> Cancelar</button>
          <div className="editor-view-switch" aria-label="Modo do editor"><button type="button" className={view === "edit" ? "active" : ""} onClick={() => setView("edit")}><Pencil aria-hidden="true" /> Editar</button><button type="button" className={view === "preview" ? "active" : ""} onClick={() => setView("preview")}><Eye aria-hidden="true" /> Pré-visualizar</button></div>
          <button className="primary-button" type="submit" disabled={saveMutation.isPending || Boolean(validationMessage)}><Save aria-hidden="true" /> {saveMutation.isPending ? "Salvando…" : "Publicar anotação"}</button>
        </div>
        <div className="note-metadata-grid">
          <label className="field field-full"><span>Título da aula</span><input required maxLength={160} value={form.title} onChange={(event) => updateForm({ title: event.target.value })} placeholder="Ex.: Árvores de decisão" /></label>
          <label className="field"><span>Disciplina</span><select required value={form.subjectId} onChange={(event) => updateForm({ subjectId: event.target.value })}>{subjectsQuery.data?.map((subject) => <option value={subject.id} key={subject.id}>{subject.name}</option>)}</select></label>
          <label className="field"><span>Formato</span><select value={form.format} onChange={(event) => updateForm({ format: event.target.value as LessonNoteFormat })}><option value="markdown">Markdown</option><option value="latex">LaTeX (fórmula)</option></select></label>
          <label className="field"><span>Data</span><input type="date" required value={form.date} onChange={(event) => updateForm({ date: event.target.value })} /></label>
          <label className="field"><span>Horário</span><input type="time" required value={form.time} onChange={(event) => updateForm({ time: event.target.value })} /></label>
        </div>
        <div className={`note-editor-split view-${view}`}>
          <section className="note-source-pane"><label htmlFor="note-content">Conteúdo em {form.format === "markdown" ? "Markdown" : "LaTeX"}</label><textarea id="note-content" maxLength={50000} required value={form.content} onChange={(event) => updateForm({ content: event.target.value })} spellCheck={form.format === "markdown"} placeholder={form.format === "markdown" ? "## Assunto da aula\n\nEscreva os pontos principais…" : "\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}"} /><span>{form.content.length.toLocaleString("pt-BR")} / 50.000</span></section>
          <section className="note-preview-pane" aria-live="polite"><h2>Pré-visualização</h2>{form.content.trim() ? <LessonNoteContent format={form.format} content={form.content} /> : <p>O conteúdo renderizado aparecerá aqui.</p>}{latexError && <div className="editor-validation" role="alert">{latexError}</div>}</section>
        </div>
        <section className="note-image-editor">
          <div><h2>Imagens</h2><p>Até oito arquivos JPEG, PNG ou WebP de no máximo 5 MB.</p></div>
          <label className="secondary-button image-picker"><Plus aria-hidden="true" /> Adicionar imagens<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => { addImages(event.target.files); event.target.value = ""; }} disabled={totalImages >= MAX_NOTE_IMAGES} /></label>
          <div className="image-draft-list">
            {existingImages.map((image, index) => <div className="image-draft" key={image.id}><img src={getLessonNoteImageUrl(image.storage_path)} alt="" /><div><label>Texto alternativo<input value={image.alt_text} maxLength={200} onChange={(event) => { setExistingDraft(existingImages.map((item) => item.id === image.id ? { ...item, alt_text: event.target.value } : item)); setDirty(true); }} /></label><label>Legenda<input value={image.caption ?? ""} maxLength={300} onChange={(event) => { setExistingDraft(existingImages.map((item) => item.id === image.id ? { ...item, caption: event.target.value } : item)); setDirty(true); }} /></label></div><span><button type="button" disabled={index === 0} onClick={() => { setExistingDraft(move(existingImages, index, -1)); setDirty(true); }} aria-label="Mover imagem para cima"><ArrowUp /></button><button type="button" disabled={index === existingImages.length - 1} onClick={() => { setExistingDraft(move(existingImages, index, 1)); setDirty(true); }} aria-label="Mover imagem para baixo"><ArrowDown /></button><button type="button" onClick={() => { setRemovedImages((current) => [...current, image]); setExistingDraft(existingImages.filter((item) => item.id !== image.id)); setDirty(true); }} aria-label="Remover imagem"><Trash2 /></button></span></div>)}
            {pendingImages.map((image, index) => <div className={`image-draft ${image.status}`} key={image.id}><img src={image.previewUrl} alt="" /><div><strong><FileImage aria-hidden="true" /> {image.file.name}</strong><label>Texto alternativo<input value={image.altText} maxLength={200} disabled={image.status === "uploaded"} onChange={(event) => { setPendingImages((current) => current.map((item) => item.id === image.id ? { ...item, altText: event.target.value } : item)); setDirty(true); }} /></label><label>Legenda<input value={image.caption} maxLength={300} disabled={image.status === "uploaded"} onChange={(event) => { setPendingImages((current) => current.map((item) => item.id === image.id ? { ...item, caption: event.target.value } : item)); setDirty(true); }} /></label>{image.status === "uploading" && <small>Enviando…</small>}{image.status === "uploaded" && <small>Upload concluído.</small>}{image.error && <small role="alert">{image.error}</small>}</div><span><button type="button" disabled={index === 0 || image.status === "uploaded"} onClick={() => setPendingImages(move(pendingImages, index, -1))} aria-label="Mover imagem para cima"><ArrowUp /></button><button type="button" disabled={index === pendingImages.length - 1 || image.status === "uploaded"} onClick={() => setPendingImages(move(pendingImages, index, 1))} aria-label="Mover imagem para baixo"><ArrowDown /></button><button type="button" disabled={image.status === "uploaded"} onClick={() => { URL.revokeObjectURL(image.previewUrl); setPendingImages((current) => current.filter((item) => item.id !== image.id)); setDirty(true); }} aria-label="Remover imagem"><Trash2 /></button></span></div>)}
            {!totalImages && <p className="no-images-copy">Nenhuma imagem adicionada. A anotação pode ser publicada apenas com texto.</p>}
          </div>
        </section>
        {validationMessage && <div className="editor-validation" role="alert">{validationMessage}</div>}
      </form>
    </section>
  );
}
