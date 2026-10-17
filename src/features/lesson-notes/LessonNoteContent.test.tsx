import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import mermaid from "mermaid";
import { LessonNoteContent } from "./LessonNoteContent";

vi.mock("mermaid", () => ({ default: {
  initialize: vi.fn(),
  render: vi.fn().mockResolvedValue({ svg: '<svg xmlns="http://www.w3.org/2000/svg"><text>Mapa de estudo</text></svg>' }),
} }));

describe("LessonNoteContent", () => {
  it("renderiza GFM sem HTML bruto, scripts ou imagens externas", () => {
    const { container } = render(
      <LessonNoteContent
        format="markdown"
        content={'# Aula\n\n- [x] seguro\n\n<script>alert("xss")</script>\n\n![externa](https://example.com/a.png)'}
      />,
    );
    expect(screen.getByRole("heading", { name: "Aula" })).toBeInTheDocument();
    expect(container.querySelector("script")).not.toBeInTheDocument();
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });

  it("renderiza uma fórmula LaTeX válida", () => {
    const { container } = render(<LessonNoteContent format="latex" content="x^2 + y^2 = z^2" />);
    expect(container.querySelector(".katex")).toBeInTheDocument();
  });

  it("renderiza matemática e diagramas dentro de Markdown", async () => {
    const { container } = render(<LessonNoteContent format="markdown" content={'A fórmula $a^2+b^2=c^2$.\n\n```mermaid\nflowchart LR\n  A --> B\n```'} />);
    expect(container.querySelector(".katex")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("img", { name: "Diagrama do conteúdo da anotação" })).toHaveTextContent("Mapa de estudo"));
    expect(mermaid.initialize).toHaveBeenCalledWith(expect.objectContaining({ htmlLabels: false }));
  });

  it("amplia o diagrama e devolve o foco ao botão quando fechado", async () => {
    const user = userEvent.setup();
    render(<LessonNoteContent format="markdown" content={'```mermaid\nflowchart LR\n  A --> B\n```'} />);
    const expand = await screen.findByRole("button", { name: "Ampliar diagrama" });
    await user.click(expand);
    expect(screen.getByRole("dialog", { name: "Diagrama ampliado" })).toHaveTextContent("Mapa de estudo");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(expand).toHaveFocus();
    expect(screen.getByRole("img", { name: "Diagrama do conteúdo da anotação" })).toHaveTextContent("Mapa de estudo");
  });

  it("permite navegar para títulos da própria anotação", () => {
    render(<LessonNoteContent format="markdown" content={'[Ir para Chomsky](#note-heading-2-hierarquia-de-chomsky)\n\n## 2. Hierarquia de Chomsky'} />);
    expect(screen.getByRole("heading", { name: "2. Hierarquia de Chomsky" })).toHaveAttribute("id", "note-heading-2-hierarquia-de-chomsky");
    expect(screen.getByRole("link", { name: "Ir para Chomsky" })).toHaveAttribute("href", "#note-heading-2-hierarquia-de-chomsky");
    expect(screen.getByRole("link", { name: "Ir para Chomsky" })).not.toHaveAttribute("target");
  });

  it("preserva o código-fonte quando o LaTeX armazenado é inválido", () => {
    const { container } = render(<LessonNoteContent format="latex" content="\\frac{" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Fórmula inválida");
    expect(container.querySelector("pre")).toHaveTextContent("\\frac{");
  });
});
