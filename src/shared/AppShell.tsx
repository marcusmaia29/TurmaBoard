import { BookOpen, CalendarDays, History, Info, LayoutDashboard, LogIn, LogOut, RefreshCw, ShieldCheck, UserRound, WifiOff } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { isSupabaseConfigured } from "../lib/supabase";
import { useToast } from "./ToastContext";
import { useRealtimeStatus } from "../features/realtime/realtime.context";

const navigation = [
  { to: "/week", label: "Semana", icon: LayoutDashboard },
  { to: "/calendar", label: "Calendário", icon: CalendarDays },
  { to: "/subjects", label: "Disciplinas", icon: BookOpen },
  { to: "/history", label: "Histórico", icon: History },
  { to: "/about", label: "Sobre", icon: Info },
];

export function AppShell() {
  const { session, isAdmin, isLoading, authError, signOut } = useAuth();
  const { status: realtimeStatus, retry: retryRealtime } = useRealtimeStatus();
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function handleSignOut() {
    try {
      await signOut();
      navigate("/week");
      showToast("Sessão encerrada.");
    } catch {
      showToast("Não foi possível sair. Tente novamente.", "error");
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink className="brand" to="/week" aria-label="TurmaBoard — página inicial">
          <span className="brand-mark">TB</span>
          <span className="brand-copy">
            <strong>TurmaBoard</strong>
            <small>Ciência da Computação · 2026.2</small>
          </span>
        </NavLink>

        <nav className="main-nav" aria-label="Navegação principal">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to={to} aria-label={label} key={to}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="account-area">
          {isLoading ? (
            <span className="account-status" aria-live="polite">Verificando acesso…</span>
          ) : session ? (
            <>
              <span className={isAdmin ? "admin-badge" : "member-badge"}>
                {isAdmin ? <ShieldCheck aria-hidden="true" /> : <UserRound aria-hidden="true" />}
                {isAdmin ? "Admin" : "Leitor"}
              </span>
              <button className="icon-button" type="button" onClick={() => void handleSignOut()} title="Sair">
                <LogOut aria-hidden="true" />
                <span className="sr-only">Sair</span>
              </button>
            </>
          ) : (
            <NavLink className="login-link" to="/login">
              <LogIn aria-hidden="true" /> Entrar
            </NavLink>
          )}
        </div>
      </header>

      {!isSupabaseConfigured && (
        <div className="configuration-banner" role="status">
          Configure as variáveis do Supabase para carregar os dados da turma.
        </div>
      )}
      {authError && session && <div className="configuration-banner error-banner" role="alert">{authError}</div>}
      {realtimeStatus === "disconnected" && (
        <div className="sync-banner" role="status">
          <WifiOff aria-hidden="true" />
          <span>Atualização ao vivo desconectada. Os dados continuam disponíveis.</span>
          <button type="button" onClick={retryRealtime}><RefreshCw aria-hidden="true" /> Tentar reconectar</button>
        </div>
      )}

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
