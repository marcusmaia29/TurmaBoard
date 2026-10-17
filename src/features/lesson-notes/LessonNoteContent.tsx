import { isValidElement, useEffect, useId, useMemo, useState, type ReactNode } from "react";
import DOMPurify from "dompurify";
import katex from "katex";
import { Expand } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import type { LessonNoteFormat } from "../../lib/database.types";
import { Dialog } from "../../shared/Dialog";
import "katex/dist/katex.min.css";

let diagramSequence = 0;

function MermaidDiagram({ definition }: { definition: string }) {
  const id = useId().replace(/:/g, "");
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let active = true;
    void import("mermaid").then(async ({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, securityLevel: "strict", htmlLabels: false, theme: "base", themeVariables: {
        primaryColor: "#F1F4FF", primaryBorderColor: "#AAB9FF", primaryTextColor: "#292C37",
        lineColor: "#676B78", secondaryColor: "#F7F8FA", tertiaryColor: "#FFFFFF",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      } });
      const result = await mermaid.render(`note-diagram-${id}-${++diagramSequence}`, definition);
      if (active) setSvg(DOMPurify.sanitize(result.svg, { USE_PROFILES: { svg: true, svgFilters: true } }));
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [definition, id]);

  if (failed) return <div className="lesson-note-diagram-error"><p>Não foi possível exibir o diagrama.</p><pre>{definition}</pre></div>;
  return <>
    <div className="lesson-note-diagram">
      <div role="img" aria-label="Diagrama do conteúdo da anotação">{svg && !expanded ? <div dangerouslySetInnerHTML={{ __html: svg }} /> : <span>{expanded ? "Diagrama ampliado." : "Carregando diagrama…"}</span>}</div>
      {svg && <button className="lesson-note-diagram-expand" type="button" onClick={() => setExpanded(true)}><Expand aria-hidden="true" /> Ampliar diagrama</button>}
    </div>
    {expanded && svg && <Dialog title="Diagrama ampliado" className="lesson-note-diagram-dialog" onClose={() => setExpanded(false)}>
      <div className="lesson-note-diagram-full" role="img" aria-label="Diagrama ampliado da anotação" dangerouslySetInnerHTML={{ __html: svg }} />
    </Dialog>}
  </>;
}

function headingText(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(headingText).join("");
  if (isValidElement<{ children?: ReactNode }>(children)) return headingText(children.props.children);
  return "";
}

function headingId(children: ReactNode): string {
  const slug = headingText(children).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `note-heading-${slug}`;
}

function MarkdownPre({ children }: { children?: ReactNode }) {
  const code = Array.isArray(children) ? children[0] : children;
  if (isValidElement<{ className?: string; children?: ReactNode }>(code) && code.props.className === "language-mermaid") {
    return <MermaidDiagram definition={String(code.props.children ?? "").trim()} />;
  }
  return <pre>{children}</pre>;
}

export function LessonNoteContent({ format, content }: { format: LessonNoteFormat; content: string }) {
  const latex = useMemo(() => {
    if (format !== "latex") return null;
    try {
      return { html: katex.renderToString(content, { displayMode: true, throwOnError: true, trust: false, strict: "error" }), error: null };
    } catch {
      return { html: null, error: "Não foi possível renderizar esta fórmula. O código-fonte foi preservado abaixo." };
    }
  }, [content, format]);

  if (format === "latex") {
    if (latex?.html) return <div className="lesson-note-latex" dangerouslySetInnerHTML={{ __html: latex.html }} />;
    return <div className="lesson-note-render-error" role="alert"><strong>Fórmula inválida</strong><p>{latex?.error}</p><pre>{content}</pre></div>;
  }

  return (
    <div className="lesson-note-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeSanitize, [rehypeKatex, { trust: false, strict: "ignore" }]]}
        components={{
          img: () => null,
          a: ({ children, href }) => <a href={href} target={href?.startsWith("#") ? undefined : "_blank"} rel={href?.startsWith("#") ? undefined : "noreferrer"}>{children}</a>,
          h1: ({ children }) => <h1 id={headingId(children)}>{children}</h1>,
          h2: ({ children }) => <h2 id={headingId(children)}>{children}</h2>,
          h3: ({ children }) => <h3 id={headingId(children)}>{children}</h3>,
          pre: MarkdownPre,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
