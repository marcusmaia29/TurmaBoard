import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { useAuth } from "./AuthContext";
import { isSupabaseConfigured } from "../../lib/supabase";

export default function LoginPage() {
  const { isAdmin, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAdmin) return <Navigate to="/week" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await signIn(email.trim(), password);
      const destination = (location.state as { from?: string } | null)?.from ?? "/week";
      navigate(destination, { replace: true });
    } catch {
      setError("E-mail ou senha inválidos. Confira os dados fornecidos pela turma.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-panel">
        <button className="back-link" type="button" onClick={() => navigate("/week")}><ArrowLeft aria-hidden="true" /> Voltar para o quadro</button>
        <span className="login-mark"><LockKeyhole aria-hidden="true" /></span>
        <h1>Acesso administrativo</h1>
        <p>Use as credenciais compartilhadas pela turma para manter prazos e referências atualizados.</p>
        <form onSubmit={(event) => void handleSubmit(event)}>
          <label className="field"><span>E-mail</span><input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label className="field"><span>Senha</span><input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          {!isSupabaseConfigured && <p className="form-error" role="alert">Configure o Supabase antes de entrar.</p>}
          <button className="primary-button login-button" type="submit" disabled={isSubmitting || !isSupabaseConfigured}>{isSubmitting ? "Entrando…" : "Entrar"}</button>
        </form>
      </section>
      <aside className="login-aside" aria-hidden="true">
        <div><span>TB</span><h2>Informação certa,<br />no momento certo.</h2><p>Uma agenda mantida pela turma para a turma.</p></div>
      </aside>
    </div>
  );
}
