import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";

export function LoadingSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="skeleton-grid" aria-label="Carregando conteúdo" aria-busy="true">
      {Array.from({ length: columns }, (_, index) => (
        <div className="skeleton-column" key={index}>
          <div className="skeleton-line skeleton-line-short" />
          <div className="skeleton-card" />
          <div className="skeleton-card skeleton-card-small" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Inbox aria-hidden="true" /></span>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="error-state" role="alert">
      <AlertTriangle aria-hidden="true" />
      <div>
        <strong>Não foi possível carregar os dados</strong>
        <p>{message ?? "Verifique a conexão e tente novamente."}</p>
      </div>
      {onRetry && (
        <button className="secondary-button" type="button" onClick={onRetry}>
          <RefreshCw aria-hidden="true" /> Tentar novamente
        </button>
      )}
    </div>
  );
}
