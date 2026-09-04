import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { queryKeys } from "../../lib/queryKeys";
import { addDays, formatWeekRange, getWeekRange } from "../../lib/date";
import type { DeliveryType, DeliveryWithSubject } from "../../lib/database.types";
import { fetchSubjects } from "../subjects/subject.service";
import { useToast } from "../../shared/ToastContext";
import { EmptyState, ErrorState, LoadingSkeleton } from "../../shared/feedback";
import { PageHeader } from "../../shared/PageHeader";
import { FilterChips } from "../../shared/FilterChips";
import { PeriodSwitcher } from "../../shared/PeriodSwitcher";
import { ResultCount, Toolbar } from "../../shared/Toolbar";
import { deliveryTypeLabels, deliveryTypes } from "./delivery.constants";
import { createDelivery, fetchDeliveries, softDeleteDelivery, updateDelivery, type DeliveryInput } from "./delivery.service";
import { DeliveryCard } from "./DeliveryCard";
import { DeliveryDialog } from "./DeliveryDialog";
import { ConfirmDialog } from "../../shared/ConfirmDialog";
import { fetchLessonNotes, softDeleteLessonNote } from "../lesson-notes/lesson-note.service";
import { LessonNoteCard } from "../lesson-notes/LessonNoteCard";
import type { LessonNoteWithSubjectAndImages } from "../../lib/database.types";
import { mergeAcademicItems } from "../lesson-notes/lesson-note.utils";

type DeliveryFilter = "all" | DeliveryType | "lesson-note";

const filterOptions: ReadonlyArray<{ value: DeliveryFilter; label: string }> = [
  { value: "all", label: "Todos" },
  ...deliveryTypes.map((type) => ({ value: type as DeliveryFilter, label: deliveryTypeLabels[type] })),
  { value: "lesson-note", label: "Anotações" },
];

export default function WeekPage() {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [filter, setFilter] = useState<DeliveryFilter>("all");
  const [dialogState, setDialogState] = useState<{ open: boolean; delivery: DeliveryWithSubject | null }>({ open: false, delivery: null });
  const [pendingDelete, setPendingDelete] = useState<DeliveryWithSubject | null>(null);
  const [pendingNoteDelete, setPendingNoteDelete] = useState<LessonNoteWithSubjectAndImages | null>(null);

  const week = useMemo(() => getWeekRange(referenceDate), [referenceDate]);
  const deliveriesQuery = useQuery({
    queryKey: queryKeys.deliveries(week.startIso, week.endIso),
    queryFn: () => fetchDeliveries(week.startIso, week.endIso),
  });
  const subjectsQuery = useQuery({ queryKey: queryKeys.subjects, queryFn: fetchSubjects });
  const notesQuery = useQuery({ queryKey: queryKeys.lessonNotes(week.startIso, week.endIso, undefined, "asc"), queryFn: () => fetchLessonNotes({ start: week.startIso, end: week.endIso, order: "asc" }) });

  const saveMutation = useMutation({
    mutationFn: async (input: DeliveryInput) => {
      if (!isAdmin) throw new Error("Permissão administrativa necessária.");
      if (dialogState.delivery) await updateDelivery(dialogState.delivery.id, input);
      else await createDelivery(input);
    },
    onSuccess: async () => {
      setDialogState({ open: false, delivery: null });
      await queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      await queryClient.invalidateQueries({ queryKey: ["history"] });
      showToast(dialogState.delivery ? "Entrega atualizada." : "Entrega adicionada.");
    },
    onError: () => showToast("Não foi possível salvar a entrega.", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (delivery: DeliveryWithSubject) => {
      if (!isAdmin) throw new Error("Permissão administrativa necessária.");
      await softDeleteDelivery(delivery.id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      await queryClient.invalidateQueries({ queryKey: ["history"] });
      setPendingDelete(null);
      showToast("Entrega removida do quadro.");
    },
    onError: () => showToast("Não foi possível remover a entrega.", "error"),
  });

  const filteredDeliveries = useMemo(
    () => (deliveriesQuery.data ?? []).filter((delivery) => filter !== "lesson-note" && (filter === "all" || delivery.type === filter)),
    [deliveriesQuery.data, filter],
  );
  const filteredNotes = useMemo(() => filter === "all" || filter === "lesson-note" ? notesQuery.data ?? [] : [], [filter, notesQuery.data]);

  const deleteNoteMutation = useMutation({
    mutationFn: softDeleteLessonNote,
    onSuccess: async () => { setPendingNoteDelete(null); await queryClient.invalidateQueries({ queryKey: ["lesson-notes"] }); await queryClient.invalidateQueries({ queryKey: ["history"] }); showToast("Anotação removida do quadro."); },
    onError: () => showToast("Não foi possível remover a anotação.", "error"),
  });

  function shiftWeek(amount: number) {
    setReferenceDate(new Date(`${addDays(week.startKey, amount * 7)}T15:00:00-03:00`));
  }

  function requestDelete(delivery: DeliveryWithSubject) {
    setPendingDelete(delivery);
  }

  const subjects = subjectsQuery.data ?? [];
  const itemCount = filteredDeliveries.length + filteredNotes.length;

  return (
    <div>
      <PageHeader
        title="Semana da turma"
        description="Prazos, atividades e anotações de aula reunidos por disciplina."
        action={isAdmin ? (
          <span className="page-actions"><Link className="secondary-button" to={subjects[0] ? `/subjects/${subjects[0].id}/notes/new` : "/subjects"}><Plus aria-hidden="true" /> Nova anotação</Link><button className="primary-button" type="button" onClick={() => setDialogState({ open: true, delivery: null })} disabled={!subjects.length}><Plus aria-hidden="true" /> Adicionar entrega</button></span>
        ) : undefined}
      />

      <Toolbar
        label="Controles do quadro"
        filters={<FilterChips label="Tipo" options={filterOptions} value={filter} onChange={setFilter} />}
      >
        <PeriodSwitcher
          label={formatWeekRange(week.startKey, week.endKey)}
          previousLabel="Semana anterior"
          nextLabel="Próxima semana"
          onPrevious={() => shiftWeek(-1)}
          onNext={() => shiftWeek(1)}
          reset={{ label: "Hoje", onReset: () => setReferenceDate(new Date()) }}
        />
        <ResultCount>{itemCount} {itemCount === 1 ? "item" : "itens"}</ResultCount>
      </Toolbar>

      {(deliveriesQuery.isLoading || subjectsQuery.isLoading || notesQuery.isLoading) && <LoadingSkeleton />}
      {(deliveriesQuery.isError || subjectsQuery.isError || notesQuery.isError) && (
        <ErrorState onRetry={() => { void deliveriesQuery.refetch(); void subjectsQuery.refetch(); void notesQuery.refetch(); }} />
      )}
      {!deliveriesQuery.isLoading && !subjectsQuery.isLoading && !notesQuery.isLoading && !deliveriesQuery.isError && !subjectsQuery.isError && !notesQuery.isError && (
        <div className="subject-board">
          {subjects.map((subject) => {
            const subjectDeliveries = filteredDeliveries.filter((delivery) => delivery.subject_id === subject.id);
            const subjectNotes = filteredNotes.filter((note) => note.subject_id === subject.id);
            const subjectItems = mergeAcademicItems(subjectDeliveries, subjectNotes);
            return (
              <section className="subject-column" style={{ "--subject-color": subject.color } as React.CSSProperties} key={subject.id}>
                <header className="subject-column-header">
                  <span className="subject-code">{subject.code}</span>
                  <div><h2>{subject.name}</h2><p>{subjectItems.length} {subjectItems.length === 1 ? "item" : "itens"}</p></div>
                  <span className="subject-count">{subjectItems.length}</span>
                </header>
                <div className="delivery-list">
                  {subjectItems.map((item) => item.kind === "delivery" ? <DeliveryCard delivery={item.data} isAdmin={isAdmin} onEdit={(delivery) => setDialogState({ open: true, delivery })} onDelete={requestDelete} key={`delivery-${item.data.id}`} /> : <LessonNoteCard note={item.data} isAdmin={isAdmin} onDelete={setPendingNoteDelete} key={`note-${item.data.id}`} />)}
                  {!subjectItems.length && <EmptyState title="Semana livre" description={filter === "all" ? "Nenhuma entrega ou anotação para esta disciplina." : "Nenhum item deste tipo."} />}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {dialogState.open && (
        <DeliveryDialog
          delivery={dialogState.delivery}
          subjects={subjects}
          isSaving={saveMutation.isPending}
          onClose={() => setDialogState({ open: false, delivery: null })}
          onSubmit={async (input) => saveMutation.mutateAsync(input)}
        />
      )}
      {pendingDelete && (
        <ConfirmDialog
          title={`Remover “${pendingDelete.title}”?`}
          description="A entrega sairá do quadro, mas a ação continuará registrada no histórico."
          confirmLabel="Remover entrega"
          isPending={deleteMutation.isPending}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => deleteMutation.mutate(pendingDelete)}
        />
      )}
      {pendingNoteDelete && <ConfirmDialog title={`Remover “${pendingNoteDelete.title}”?`} description="A anotação sairá do quadro, mas a ação continuará registrada no histórico." confirmLabel="Remover anotação" isPending={deleteNoteMutation.isPending} onCancel={() => setPendingNoteDelete(null)} onConfirm={() => deleteNoteMutation.mutate(pendingNoteDelete)} />}
    </div>
  );
}
