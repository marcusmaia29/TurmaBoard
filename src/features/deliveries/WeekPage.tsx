import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { queryKeys } from "../../lib/queryKeys";
import { addDays, formatWeekRange, getWeekRange } from "../../lib/date";
import type { DeliveryType, DeliveryWithSubject } from "../../lib/database.types";
import { fetchSubjects } from "../subjects/subject.service";
import { useToast } from "../../shared/ToastContext";
import { EmptyState, ErrorState, LoadingSkeleton } from "../../shared/feedback";
import { PageHeader } from "../../shared/PageHeader";
import { deliveryTypeLabels, deliveryTypes } from "./delivery.constants";
import { createDelivery, fetchDeliveries, softDeleteDelivery, updateDelivery, type DeliveryInput } from "./delivery.service";
import { DeliveryCard } from "./DeliveryCard";
import { DeliveryDialog } from "./DeliveryDialog";

type DeliveryFilter = "all" | DeliveryType;

export default function WeekPage() {
  const { isAdmin, session } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [filter, setFilter] = useState<DeliveryFilter>("all");
  const [dialogState, setDialogState] = useState<{ open: boolean; delivery: DeliveryWithSubject | null }>({ open: false, delivery: null });

  const week = useMemo(() => getWeekRange(referenceDate), [referenceDate]);
  const deliveriesQuery = useQuery({
    queryKey: queryKeys.deliveries(week.startIso, week.endIso),
    queryFn: () => fetchDeliveries(week.startIso, week.endIso),
  });
  const subjectsQuery = useQuery({ queryKey: queryKeys.subjects, queryFn: fetchSubjects });

  const saveMutation = useMutation({
    mutationFn: async (input: DeliveryInput) => {
      if (!session) throw new Error("Faça login para editar o quadro.");
      if (dialogState.delivery) await updateDelivery(dialogState.delivery.id, input, session.user.id);
      else await createDelivery(input, session.user.id);
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
      if (!session) throw new Error("Faça login para editar o quadro.");
      await softDeleteDelivery(delivery.id, session.user.id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      await queryClient.invalidateQueries({ queryKey: ["history"] });
      showToast("Entrega removida do quadro.");
    },
    onError: () => showToast("Não foi possível remover a entrega.", "error"),
  });

  const filteredDeliveries = useMemo(
    () => (deliveriesQuery.data ?? []).filter((delivery) => filter === "all" || delivery.type === filter),
    [deliveriesQuery.data, filter],
  );

  function shiftWeek(amount: number) {
    setReferenceDate(new Date(`${addDays(week.startKey, amount * 7)}T15:00:00-03:00`));
  }

  function requestDelete(delivery: DeliveryWithSubject) {
    if (window.confirm(`Remover “${delivery.title}”? A ação ficará registrada no histórico.`)) {
      deleteMutation.mutate(delivery);
    }
  }

  const subjects = subjectsQuery.data ?? [];

  return (
    <div>
      <PageHeader
        title="Entregas da semana"
        description="Prazos e atividades da turma reunidos por disciplina."
        action={isAdmin ? (
          <button className="primary-button" type="button" onClick={() => setDialogState({ open: true, delivery: null })} disabled={!subjects.length}>
            <Plus aria-hidden="true" /> Adicionar entrega
          </button>
        ) : undefined}
      />

      <section className="board-toolbar" aria-label="Controles do quadro">
        <div className="filter-list" aria-label="Filtrar por tipo">
          <button className={filter === "all" ? "active" : ""} type="button" onClick={() => setFilter("all")}>Todos</button>
          {deliveryTypes.map((type) => (
            <button className={filter === type ? "active" : ""} type="button" onClick={() => setFilter(type)} key={type}>{deliveryTypeLabels[type]}</button>
          ))}
        </div>
        <div className="period-switcher">
          <button className="icon-button" type="button" onClick={() => shiftWeek(-1)} aria-label="Semana anterior"><ChevronLeft aria-hidden="true" /></button>
          <div>
            <strong>{formatWeekRange(week.startKey, week.endKey)}</strong>
            <button type="button" onClick={() => setReferenceDate(new Date())}>Voltar para esta semana</button>
          </div>
          <button className="icon-button" type="button" onClick={() => shiftWeek(1)} aria-label="Próxima semana"><ChevronRight aria-hidden="true" /></button>
        </div>
        <span className="result-count">{filteredDeliveries.length} {filteredDeliveries.length === 1 ? "item" : "itens"}</span>
      </section>

      {(deliveriesQuery.isLoading || subjectsQuery.isLoading) && <LoadingSkeleton />}
      {(deliveriesQuery.isError || subjectsQuery.isError) && (
        <ErrorState onRetry={() => { void deliveriesQuery.refetch(); void subjectsQuery.refetch(); }} />
      )}
      {!deliveriesQuery.isLoading && !subjectsQuery.isLoading && !deliveriesQuery.isError && !subjectsQuery.isError && (
        <div className="subject-board">
          {subjects.map((subject) => {
            const subjectDeliveries = filteredDeliveries.filter((delivery) => delivery.subject_id === subject.id);
            return (
              <section className="subject-column" style={{ "--subject-color": subject.color } as React.CSSProperties} key={subject.id}>
                <header className="subject-column-header">
                  <span className="subject-code">{subject.code}</span>
                  <div><h2>{subject.name}</h2><p>{subjectDeliveries.length} {subjectDeliveries.length === 1 ? "item" : "itens"}</p></div>
                  <span className="subject-count">{subjectDeliveries.length}</span>
                </header>
                <div className="delivery-list">
                  {subjectDeliveries.map((delivery) => (
                    <DeliveryCard delivery={delivery} isAdmin={isAdmin} onEdit={(item) => setDialogState({ open: true, delivery: item })} onDelete={requestDelete} key={delivery.id} />
                  ))}
                  {!subjectDeliveries.length && <EmptyState title="Semana livre" description={filter === "all" ? "Nenhuma entrega para esta disciplina." : "Nenhum item deste tipo."} />}
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
    </div>
  );
}
