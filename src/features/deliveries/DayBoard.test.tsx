import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LessonNoteWithSubjectAndImages } from "../../lib/database.types";
import { makeDelivery, makeSubject } from "../../test/factories";
import { mergeAcademicItems } from "../lesson-notes/lesson-note.utils";
import { DayBoard } from "./DayBoard";

const scrollTo = vi.fn();
const scrollBy = vi.fn();
function board(startKey = "2026-08-31") {
  const subject = makeSubject();
  const note: LessonNoteWithSubjectAndImages = {
    id: "note", subject_id: subject.id, subject, title: "Friday lesson", occurred_at: "2026-09-05T02:00:00Z",
    content: "", content_format: "markdown", images: [], created_by: null, created_by_name: "Admin", updated_by: null,
    updated_by_name: "Admin", created_at: "2026-09-04T12:00:00Z", updated_at: "2026-09-04T12:00:00Z", deleted_at: null,
  };
  return render(<DayBoard startKey={startKey} items={mergeAcademicItems([
    makeDelivery({ id: "early", title: "Early", due_at: "2026-09-04T22:00:00Z" }),
    makeDelivery({ id: "weekend", title: "Weekend", due_at: "2026-09-05T03:00:00Z" }),
  ], [note])} renderItem={(item) => <h3>{item.data.title}</h3>} />);
}

describe("DayBoard", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-09-02T15:00:00Z"));
    vi.spyOn(HTMLElement.prototype, "offsetLeft", "get").mockImplementation(function (this: HTMLElement) { return Array.from(this.parentElement?.children ?? []).indexOf(this) * 300; });
    HTMLElement.prototype.scrollTo = scrollTo;
    HTMLElement.prototype.scrollBy = scrollBy;
  });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.clearAllMocks(); });

  it("groups notes and deadlines by São Paulo date and sorts them chronologically", () => {
    board();
    const friday = screen.getByRole("region", { name: "Sexta-feira 04/09" });
    expect(within(friday).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual(["Early", "Friday lesson"]);
    expect(within(screen.getByRole("region", { name: "Sábado 05/09" })).getByText("Weekend")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Quarta-feira 02/09" })).toHaveAttribute("aria-current", "date");
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 0, behavior: "instant" });
  });

  it.each([["2026-09-05T03:00:00Z", 1500], ["2026-09-07T02:59:00Z", 1800]])("reveals the current weekend day at %s", (now, left) => {
    vi.setSystemTime(new Date(now));
    board();
    expect(scrollTo).toHaveBeenLastCalledWith({ left, behavior: "instant" });
    expect(screen.getByText("Hoje")).toBeInTheDocument();
  });

  it("does not highlight today in a different week", () => {
    board("2026-09-07");
    expect(screen.queryByText("Hoje")).not.toBeInTheDocument();
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 0, behavior: "instant" });
  });

  it("provides keyboard-operable navigation to hidden days", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    board();
    const next = screen.getByRole("button", { name: "Próximos dias" });
    next.focus();
    await user.keyboard("{Enter}");
    expect(scrollBy).toHaveBeenCalled();
    expect(screen.getByRole("region", { name: "Quadro por dia, de segunda a domingo" })).toHaveAttribute("tabindex", "0");
  });
});
