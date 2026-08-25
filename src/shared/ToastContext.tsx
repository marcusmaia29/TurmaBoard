import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";

type ToastTone = "success" | "error";

interface ToastMessage {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, tone: ToastTone = "success") => {
    const id = Date.now();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => removeToast(id), 4200);
  }, [removeToast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div className={`toast toast-${toast.tone}`} key={toast.id}>
            {toast.tone === "success" ? <CheckCircle2 aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
            <span>{toast.message}</span>
            <button type="button" onClick={() => removeToast(toast.id)} aria-label="Fechar mensagem">
              <X aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used inside ToastProvider.");
  return value;
}
