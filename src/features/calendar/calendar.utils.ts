import { addDays, getMonthRange } from "../../lib/date";

export function getCalendarKeys(reference: Date): string[] {
  const month = getMonthRange(reference);
  const firstDay = new Date(`${month.startKey}T12:00:00Z`).getUTCDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const gridStart = addDays(month.startKey, -offset);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

export function getCalendarQueryRange(reference: Date): { startIso: string; endIso: string } {
  const keys = getCalendarKeys(reference);
  return {
    startIso: `${keys[0]}T00:00:00-03:00`,
    endIso: `${addDays(keys[keys.length - 1], 1)}T00:00:00-03:00`,
  };
}
