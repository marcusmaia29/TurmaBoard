import { BookOpen, CalendarDays, History, Info, LayoutDashboard, LogIn, LogOut, ShieldCheck } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { isSupabaseConfigured } from "../lib/supabase";

const navigation = [
  { to: "/week", label: "Semana", icon: LayoutDashboard },
  { to: "/calendar", label: "Calendário", icon: CalendarDays },
  { to: "/subjects", label: "Disciplinas", icon: BookOpen },
  { to: "/history", label: "Histórico", icon: History },
  { to: "/about", label: "Sobre", icon: Info },
];

export function AppShell() {
  const { isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/week");
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
          {isAdmin ? (
            <>
              <span className="admin-badge"><ShieldCheck aria-hidden="true" /> Admin</span>
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

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
