import { isValidElement, useEffect, useId, useMemo, useState, type ReactNode } from "react";
import DOMPurify from "dompurify";
import katex from "katex";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import type { LessonNoteFormat } from "../../lib/database.types";
import "katex/dist/katex.min.css";

let diagramSequence = 0;

function MermaidDiagram({ definition }: { definition: string }) {
  const id = useId().replace(/:/g, "");
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

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
  return <div className="lesson-note-diagram" role="img" aria-label="Diagrama do conteúdo da anotação">{svg ? <div dangerouslySetInnerHTML={{ __html: svg }} /> : <span>Carregando diagrama…</span>}</div>;
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
          a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>,
          pre: MarkdownPre,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
