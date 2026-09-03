import { useMemo } from "react";
import katex from "katex";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import type { LessonNoteFormat } from "../../lib/database.types";
import "katex/dist/katex.min.css";

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
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          img: () => null,
          a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
