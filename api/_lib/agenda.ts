import { XMLParser, XMLValidator } from "fast-xml-parser";
import type { AgendaEvent, AgendaResponse } from "../../src/features/rooms/agenda.types.js";

type XmlValue = string | number | boolean | null | undefined;
type XmlRecord = Record<string, unknown>;

const EVENT_KEY = "CalendarioEvento";

function text(value: XmlValue): string {
  return value == null ? "" : String(value).trim()
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&apos;", "'");
}

function dateKey(value: XmlValue): string {
  const raw = text(value);
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : raw.slice(0, 10);
}

function clock(value: XmlValue): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(text(value));
  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : "";
}

function stableHash(parts: string[]): string {
  let hash = 0x811c9dc5;
  for (const character of parts.join("\u001f")) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return `agenda-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function findEventNodes(value: unknown): XmlRecord[] {
  if (!value || typeof value !== "object") return [];
  const record = value as XmlRecord;
  if (EVENT_KEY in record) {
    const events = record[EVENT_KEY];
    return (Array.isArray(events) ? events : [events]).filter(
      (event): event is XmlRecord => Boolean(event) && typeof event === "object",
    );
  }
  return Object.values(record).flatMap(findEventNodes);
}

function normalizeEvent(raw: XmlRecord): AgendaEvent {
  const event = {
    date: dateKey(raw.data as XmlValue),
    type: text(raw.tipoaula as XmlValue),
    start: clock(raw.horainicio as XmlValue),
    end: clock(raw.horatermino as XmlValue),
    className: text(raw.turma as XmlValue),
    title: text(raw.titulo as XmlValue),
    professor: text(raw.professor as XmlValue),
    room: text(raw.sala as XmlValue),
    floor: text(raw.andar as XmlValue),
    building: text(raw.predio as XmlValue),
    courseFamily: text(raw.familia_curso as XmlValue),
    cancelled: text(raw.cancelada as XmlValue).toUpperCase() === "S",
  };

  return {
    id: stableHash([
      event.date,
      event.start,
      event.end,
      event.className,
      event.title,
      event.professor,
      event.room,
      event.building,
    ]),
    ...event,
  };
}

function sourceGeneratedAt(raw: XmlRecord | undefined): string | null {
  if (!raw) return null;
  const date = dateKey(raw.datageracao as XmlValue);
  const time = clock(raw.horageracao as XmlValue);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const parsed = new Date(`${date}T${time}:00-03:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function parseAgendaXml(xml: string, fetchedAt = new Date()): AgendaResponse {
  const validation = XMLValidator.validate(xml);
  if (validation !== true) throw new Error(`XML inválido: ${validation.err.msg}`);

  const parsed = new XMLParser({
    processEntities: false,
    trimValues: true,
    parseTagValue: false,
    ignoreAttributes: true,
  }).parse(xml) as unknown;
  const rawEvents = findEventNodes(parsed);
  const normalizedEvents = rawEvents
    .map(normalizeEvent)
    .filter((event) => event.date && event.start && event.end);
  const events = [...new Map(normalizedEvents.map((event) => [event.id, event])).values()]
    .sort((a, b) => a.start.localeCompare(b.start) || a.room.localeCompare(b.room, "pt-BR"));

  return {
    date: events[0]?.date ?? new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(fetchedAt),
    sourceGeneratedAt: sourceGeneratedAt(rawEvents[0]),
    fetchedAt: fetchedAt.toISOString(),
    events,
  };
}

export { stableHash };
