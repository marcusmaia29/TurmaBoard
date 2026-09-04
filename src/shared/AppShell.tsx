import { BookOpen, Building2, CalendarDays, ChevronDown, ExternalLink, Github, History, LayoutDashboard, LogIn, LogOut, MoreHorizontal, RefreshCw, ShieldCheck, Table2, UserRound, WifiOff } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { isSupabaseConfigured } from "../lib/supabase";
import { Menu } from "./Menu";
import { useToast } from "./ToastContext";
import { useRealtimeStatus } from "../features/realtime/realtime.context";

const primaryNavigation = [
  { to: "/week", label: "Semana", icon: LayoutDashboard },
  { to: "/calendar", label: "Calendário", icon: CalendarDays },
  { to: "/subjects", label: "Disciplinas", icon: BookOpen },
  { to: "/rooms", label: "Salas", icon: Building2 },
];

const secondaryNavigation = [
  { to: "/history", label: "Histórico", icon: History },
  { to: "/grade", label: "Grade", icon: Table2 },
];

export function AppShell() {
  const { session, isAdmin, isLoading, authError, signOut } = useAuth();
  const { status: realtimeStatus, retry: retryRealtime } = useRealtimeStatus();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // Without this the two destinations behind the menu lose the "you are here"
  // signal that .nav-link.active gives every other destination.
  const isSecondarySectionOpen = secondaryNavigation.some((item) => pathname.startsWith(item.to));

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
          <span className="brand-mark" aria-hidden="true"><CalendarDays /></span>
          <span className="brand-copy">
            <strong>TurmaBoard</strong>
            <small>Ciência da Computação · 2026.2</small>
          </span>
        </NavLink>

        <div className="nav-cluster">
          <nav className="main-nav" aria-label="Navegação principal">
            {primaryNavigation.map(({ to, label, icon: Icon }) => (
              <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to={to} aria-label={label} key={to}>
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <Menu
            label="Mais ações"
            className="menu-wrapper nav-menu"
            triggerClassName={`nav-link nav-menu-trigger${isSecondarySectionOpen ? " active" : ""}`}
            panelClassName="menu-panel menu-panel-wide"
            triggerContent={
              <>
                <MoreHorizontal aria-hidden="true" />
                <span>Mais ações</span>
                <ChevronDown className="menu-chevron" aria-hidden="true" />
              </>
            }
          >
            {(close) => (
              <>
                {secondaryNavigation.map(({ to, label, icon: Icon }) => (
                  <NavLink className={({ isActive }) => (isActive ? "active" : "")} to={to} onClick={close} key={to}>
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                  </NavLink>
                ))}

                <span className="menu-separator" aria-hidden="true" />

                <a
                  href="https://github.com/marcusmaia29/TurmaBoard"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Dar uma estrela no TurmaBoard no GitHub"
                  onClick={close}
                >
                  <Github aria-hidden="true" />
                  <span>Star</span>
                  <ExternalLink className="menu-external" aria-hidden="true" />
                </a>

                {isLoading && (
                  <>
                    <span className="menu-separator" aria-hidden="true" />
                    <span className="menu-note" aria-live="polite">Verificando acesso…</span>
                  </>
                )}
                {!isLoading && session && (
                  <>
                    <span className="menu-separator" aria-hidden="true" />
                    <span className="menu-note">
                      <span className={isAdmin ? "admin-badge" : "member-badge"}>
                        {isAdmin ? <ShieldCheck aria-hidden="true" /> : <UserRound aria-hidden="true" />}
                        {isAdmin ? "Admin" : "Leitor"}
                      </span>
                    </span>
                    <button className="danger-action" type="button" onClick={() => { close(); void handleSignOut(); }}>
                      <LogOut aria-hidden="true" />
                      <span>Sair</span>
                    </button>
                  </>
                )}
              </>
            )}
          </Menu>
        </div>

        {!isLoading && !session && (
          <div className="account-area">
            <NavLink className="login-link" to="/login">
              <LogIn aria-hidden="true" /><span>Entrar</span>
            </NavLink>
          </div>
        )}
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
