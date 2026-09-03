import type { AgendaEvent } from "./agenda.types";

export const CLASS_NAME = "4º CIÊNCIA DA COMPUTAÇÃO A";

export interface AvailableRoom {
  key: string;
  room: string;
  floor: string;
  building: string;
  previousEvent: AgendaEvent | null;
  nextEvent: AgendaEvent | null;
}

export interface RoomGroup {
  building: string;
  floors: Array<{ floor: string; rooms: AvailableRoom[] }>;
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : -1;
}

export function minutesToTime(minutes: number): string {
  const safe = Math.max(0, Math.min(23 * 60 + 59, minutes));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

export function isPhysicalRoom(event: AgendaEvent): boolean {
  return Boolean(event.room.trim()) && event.room.trim().toLocaleUpperCase("pt-BR") !== "AULA REMOTA";
}

function roomKey(event: Pick<AgendaEvent, "building" | "room">): string {
  return `${event.building.trim().toLocaleUpperCase("pt-BR")}::${event.room.trim().toLocaleUpperCase("pt-BR")}`;
}

function overlaps(event: AgendaEvent, start: number, end: number): boolean {
  return timeToMinutes(event.start) < end && timeToMinutes(event.end) > start;
}

export function getAvailableRooms(
  events: AgendaEvent[],
  startTime: string,
  endTime: string,
  selectedBuilding = "all",
): AvailableRoom[] {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start < 0 || end <= start) return [];

  const inventory = new Map<string, AvailableRoom>();
  for (const event of events) {
    if (!isPhysicalRoom(event)) continue;
    const key = roomKey(event);
    const current = inventory.get(key);
    if (!current || (!current.floor && event.floor)) {
      inventory.set(key, {
        key,
        room: event.room.trim(),
        floor: event.floor.trim(),
        building: event.building.trim() || "Prédio não informado",
        previousEvent: null,
        nextEvent: null,
      });
    }
  }

  const activeEvents = events.filter((event) => !event.cancelled && isPhysicalRoom(event));
  return [...inventory.values()]
    .filter((room) => selectedBuilding === "all" || room.building === selectedBuilding)
    .filter((room) => !activeEvents.some((event) => roomKey(event) === room.key && overlaps(event, start, end)))
    .map((room) => {
      const schedule = activeEvents
        .filter((event) => roomKey(event) === room.key)
        .sort((a, b) => a.start.localeCompare(b.start));
      const previousEvent = [...schedule]
        .reverse()
        .find((event) => timeToMinutes(event.end) <= start) ?? null;
      const nextEvent = schedule.find((event) => timeToMinutes(event.start) >= end) ?? null;
      return { ...room, previousEvent, nextEvent };
    })
    .sort((a, b) => {
      if (!a.nextEvent && b.nextEvent) return -1;
      if (a.nextEvent && !b.nextEvent) return 1;
      const nextDifference = (b.nextEvent ? timeToMinutes(b.nextEvent.start) : Infinity)
        - (a.nextEvent ? timeToMinutes(a.nextEvent.start) : Infinity);
      return nextDifference || a.building.localeCompare(b.building, "pt-BR", { numeric: true })
        || a.floor.localeCompare(b.floor, "pt-BR", { numeric: true })
        || a.room.localeCompare(b.room, "pt-BR", { numeric: true });
    });
}

export function groupRooms(rooms: AvailableRoom[]): RoomGroup[] {
  const buildings = new Map<string, Map<string, AvailableRoom[]>>();
  for (const room of rooms) {
    const floors = buildings.get(room.building) ?? new Map<string, AvailableRoom[]>();
    const floor = room.floor || "Andar não informado";
    floors.set(floor, [...(floors.get(floor) ?? []), room]);
    buildings.set(room.building, floors);
  }
  return [...buildings.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "pt-BR", { numeric: true }))
    .map(([building, floors]) => ({
      building,
      floors: [...floors.entries()]
        .sort(([a], [b]) => a.localeCompare(b, "pt-BR", { numeric: true }))
        .map(([floor, floorRooms]) => ({ floor, rooms: floorRooms })),
    }));
}

export function getClassEvents(events: AgendaEvent[]): AgendaEvent[] {
  return events
    .filter((event) => event.className.trim().toLocaleUpperCase("pt-BR") === CLASS_NAME)
    .sort((a, b) => a.start.localeCompare(b.start));
}

export function getHighlightedClass(events: AgendaEvent[], nowTime: string): AgendaEvent | null {
  const minute = timeToMinutes(nowTime);
  const active = events.filter((event) => !event.cancelled);
  return active.find((event) => timeToMinutes(event.start) <= minute && timeToMinutes(event.end) > minute)
    ?? active.find((event) => timeToMinutes(event.start) >= minute)
    ?? null;
}
