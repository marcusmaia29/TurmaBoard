import { CalendarDays, ExternalLink } from "lucide-react";
import { PageHeader } from "../../shared/PageHeader";

const PRODUCTION_URL = "https://turmaboard.vercel.app";

export default function AboutPage() {
  return (
    <div>
      <PageHeader
        title="Sobre o TurmaBoard"
        description="Uma agenda acadêmica compartilhada, mantida pela turma para reunir prazos, referências e avisos em um só lugar."
      />
      <section className="about-card" aria-labelledby="production-title">
        <span className="about-mark" aria-hidden="true"><CalendarDays /></span>
        <div>
          <h2 id="production-title">Ambiente publicado</h2>
          <p>Acesse a versão oficial do TurmaBoard para consultar as informações mais recentes da turma.</p>
        </div>
        <a className="primary-button" href={PRODUCTION_URL} target="_blank" rel="noreferrer">
          Acessar o TurmaBoard <ExternalLink aria-hidden="true" />
        </a>
      </section>
    </div>
  );
}
