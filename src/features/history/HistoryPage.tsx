import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FilePenLine, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "../../shared/PageHeader";
import { PeriodSwitcher } from "../../shared/PeriodSwitcher";
import { EmptyState, ErrorState, LoadingSkeleton } from "../../shared/feedback";
import { queryKeys } from "../../lib/queryKeys";
import { APP_TIME_ZONE } from "../../lib/date";
import { fetchHistory } from "./history.service";

const actionCopy = {
  created: { label: "Criação", icon: Plus },
  updated: { label: "Atualização", icon: FilePenLine },
  deleted: { label: "Remoção", icon: Trash2 },
};

export default function HistoryPage() {
  const [page, setPage] = useState(0);
  const query = useQuery({ queryKey: queryKeys.history(page), queryFn: () => fetchHistory(page) });

  return (
    <div>
      <PageHeader title="Histórico de alterações" description="Um registro transparente do que foi criado, atualizado ou removido." />
      {query.isLoading && <LoadingSkeleton columns={2} />}
      {query.isError && <ErrorState onRetry={() => void query.refetch()} />}
      {!query.isLoading && !query.isError && !query.data?.entries.length && <EmptyState title="Histórico vazio" description="As próximas alterações aparecerão aqui automaticamente." />}
      {!!query.data?.entries.length && (
        <>
          <ol className="panel history-list">
            {query.data.entries.map((entry) => {
              const action = actionCopy[entry.action];
              const Icon = action.icon;
              return (
                <li key={entry.id}>
                  <span className={`history-icon history-${entry.action}`}><Icon aria-hidden="true" /></span>
                  <div><p><strong>{entry.actor_name}</strong> {entry.summary}</p><span>{action.label} · {entry.entity_type === "deliveries" ? "Entrega" : entry.entity_type === "subjects" ? "Disciplina" : entry.entity_type === "lesson_notes" ? "Anotação" : entry.entity_type === "lesson_note_images" ? "Imagem da anotação" : "Link"}</span></div>
                  <time dateTime={entry.created_at}>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short", timeZone: APP_TIME_ZONE }).format(new Date(entry.created_at))}</time>
                </li>
              );
            })}
          </ol>
          <div className="pagination">
            <PeriodSwitcher
              label={`Página ${page + 1}`}
              previousLabel="Página anterior"
              nextLabel="Próxima página"
              onPrevious={() => setPage((value) => value - 1)}
              onNext={() => setPage((value) => value + 1)}
              isPreviousDisabled={page === 0}
              isNextDisabled={!query.data.hasNextPage}
            />
          </div>
        </>
      )}
    </div>
  );
}
