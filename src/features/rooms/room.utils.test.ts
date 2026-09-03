import { describe, expect, it } from "vitest";
import type { AgendaEvent } from "./agenda.types";
import { getAvailableRooms, getHighlightedClass } from "./room.utils";

function event(overrides: Partial<AgendaEvent> = {}): AgendaEvent {
  return {
    id: "event",
    date: "2026-09-02",
    type: "Aula",
    start: "10:00",
    end: "11:00",
    className: "Outra turma",
    title: "Disciplina",
    professor: "Professor",
    room: "101",
    floor: "1º andar",
    building: "Prédio 1",
    courseFamily: "Graduação",
    cancelled: false,
    ...overrides,
  };
}

describe("getAvailableRooms", () => {
  it("considera limites exatos como livres e bloqueia sobreposição", () => {
    const events = [
      event({ id: "a", room: "101", start: "10:00", end: "11:00" }),
      event({ id: "b", room: "202", start: "11:00", end: "12:00" }),
    ];
    expect(getAvailableRooms(events, "09:00", "10:00").map((room) => room.room)).toEqual(["202", "101"]);
    expect(getAvailableRooms(events, "10:30", "11:30")).toHaveLength(0);
  });

  it("ignora eventos cancelados e exclui salas vazias e remotas", () => {
    const events = [
      event({ id: "cancelled", cancelled: true }),
      event({ id: "remote", room: "AULA REMOTA" }),
      event({ id: "blank", room: "" }),
    ];
    expect(getAvailableRooms(events, "10:00", "11:00").map((room) => room.room)).toEqual(["101"]);
  });

  it("não mistura salas de mesmo nome em prédios diferentes", () => {
    const events = [event({ id: "one" }), event({ id: "two", building: "Prédio 2" })];
    const available = getAvailableRooms(events, "08:00", "09:00");
    expect(available).toHaveLength(2);
    expect(new Set(available.map((room) => room.key)).size).toBe(2);
  });

  it("informa o evento anterior e o próximo", () => {
    const events = [
      event({ id: "before", start: "08:00", end: "09:00" }),
      event({ id: "after", start: "12:00", end: "13:00" }),
    ];
    const [room] = getAvailableRooms(events, "10:00", "11:00");
    expect(room.previousEvent?.id).toBe("before");
    expect(room.nextEvent?.id).toBe("after");
  });
});

describe("getHighlightedClass", () => {
  it("prioriza aula atual, depois a próxima, e ignora canceladas", () => {
    const events = [
      event({ id: "cancelled", start: "09:00", cancelled: true }),
      event({ id: "current", start: "10:00", end: "11:00" }),
      event({ id: "next", start: "12:00", end: "13:00" }),
    ];
    expect(getHighlightedClass(events, "10:30")?.id).toBe("current");
    expect(getHighlightedClass(events, "11:30")?.id).toBe("next");
  });
});
