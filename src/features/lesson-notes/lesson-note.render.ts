import katex from "katex";

export function getLatexError(content: string): string | null {
  try {
    katex.renderToString(content, { displayMode: true, throwOnError: true, trust: false, strict: "error" });
    return null;
  } catch (error) {
    return error instanceof Error ? error.message.replace(/^KaTeX parse error:\s*/i, "") : "Fórmula inválida.";
  }
}
