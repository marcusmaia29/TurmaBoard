import { render, screen } from "@testing-library/react";
import { LessonNoteContent } from "./LessonNoteContent";

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

  it("preserva o código-fonte quando o LaTeX armazenado é inválido", () => {
    const { container } = render(<LessonNoteContent format="latex" content="\\frac{" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Fórmula inválida");
    expect(container.querySelector("pre")).toHaveTextContent("\\frac{");
  });
});
