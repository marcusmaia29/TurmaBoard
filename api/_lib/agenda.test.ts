import { describe, expect, it } from "vitest";
import { parseAgendaXml } from "./agenda.js";

const xml = `<?xml version="1.0" encoding="utf-8"?>
<ArrayOfCalendarioEvento>
  <CalendarioEvento>
    <data>02/09/2026</data><tipoaula>Aula</tipoaula><horainicio>09:45:00</horainicio><horatermino>11:30:00</horatermino>
    <turma>4º CIÊNCIA DA COMPUTAÇÃO A</turma><titulo>Computação &amp; Sociedade</titulo><professor>Ana</professor>
    <sala>404</sala><andar>4º andar</andar><predio>Prédio 1</predio><datageracao>02/09/2026</datageracao><horageracao>07:30:00</horageracao>
    <cancelada>N</cancelada><familia_curso>Graduação</familia_curso>
  </CalendarioEvento>
  <CalendarioEvento>
    <data>02/09/2026</data><tipoaula>Reunião</tipoaula><horainicio>08:00</horainicio><horatermino>09:00</horatermino>
    <turma>Outra turma</turma><titulo>Reserva</titulo><professor></professor><sala>Lab 2</sala><andar>Térreo</andar><predio>Prédio 2</predio>
    <cancelada>S</cancelada><familia_curso></familia_curso>
  </CalendarioEvento>
</ArrayOfCalendarioEvento>`;

describe("parseAgendaXml", () => {
  it("normaliza eventos, acentos, cancelamento e data de geração", () => {
    const result = parseAgendaXml(xml, new Date("2026-09-02T12:00:00.000Z"));

    expect(result.date).toBe("2026-09-02");
    expect(result.sourceGeneratedAt).toBe("2026-09-02T10:30:00.000Z");
    expect(result.events).toHaveLength(2);
    expect(result.events[1]).toMatchObject({
      start: "09:45",
      end: "11:30",
      title: "Computação & Sociedade",
      room: "404",
      cancelled: false,
    });
    expect(result.events[0].cancelled).toBe(true);
  });

  it("gera o mesmo id para o mesmo evento", () => {
    const first = parseAgendaXml(xml).events.map((event) => event.id);
    const second = parseAgendaXml(xml).events.map((event) => event.id);
    expect(first).toEqual(second);
  });

  it("aceita um único evento e rejeita XML malformado", () => {
    const single = xml.replace(/<CalendarioEvento>[\s\S]*?<\/CalendarioEvento>\s*<CalendarioEvento>/, "<CalendarioEvento>");
    expect(parseAgendaXml(single).events).toHaveLength(1);
    expect(() => parseAgendaXml("<agenda><evento></agenda>")).toThrow("XML inválido");
  });
});
