export const APP_TIME_ZONE = "America/Sao_Paulo";

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function utcDateFromKey(dateKey: string): Date {
  return new Date(`${dateKey}T12:00:00Z`);
}

export function toDateKey(date: Date): string {
  const parts = dateKeyFormatter.formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function addDays(dateKey: string, amount: number): string {
  const date = utcDateFromKey(dateKey);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function getWeekRange(reference: Date): { startKey: string; endKey: string; startIso: string; endIso: string } {
  const referenceKey = toDateKey(reference);
  const day = utcDateFromKey(referenceKey).getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  const startKey = addDays(referenceKey, -daysSinceMonday);
  const endKey = addDays(startKey, 6);
  return {
    startKey,
    endKey,
    startIso: `${startKey}T00:00:00-03:00`,
    endIso: `${addDays(endKey, 1)}T00:00:00-03:00`,
  };
}

export function getMonthRange(reference: Date): { startKey: string; endKey: string; startIso: string; endIso: string } {
  const dateKey = toDateKey(reference);
  const [year, month] = dateKey.split("-").map(Number);
  const startKey = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = new Date(Date.UTC(year, month, 1));
  const endKey = nextMonth.toISOString().slice(0, 10);
  return {
    startKey,
    endKey,
    startIso: `${startKey}T00:00:00-03:00`,
    endIso: `${endKey}T00:00:00-03:00`,
  };
}

/** Zero-padded day/month, short enough to sit on one line beside the controls. */
export function formatWeekRange(startKey: string, endKey: string): string {
  const dayMonth = (dateKey: string) => {
    const [, month, day] = dateKey.split("-");
    return `${day}/${month}`;
  };
  return `${dayMonth(startKey)} a ${dayMonth(endKey)}`;
}

export function formatMonthTitle(reference: Date): string {
  const value = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: APP_TIME_ZONE,
  }).format(reference);
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatDeadline(isoDate: string): { date: string; time: string } {
  const date = new Date(isoDate);
  return {
    date: new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: APP_TIME_ZONE }).format(date),
    time: new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: APP_TIME_ZONE }).format(date),
  };
}

export function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const minutes = Math.round((date.getTime() - Date.now()) / 60_000);
  const formatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  return formatter.format(Math.round(hours / 24), "day");
}

export type DeadlineTone = "overdue" | "urgent" | "normal";

export function getDeadlineTone(isoDate: string, now = new Date()): DeadlineTone {
  const difference = new Date(isoDate).getTime() - now.getTime();
  if (difference < 0) return "overdue";
  if (difference <= 24 * 60 * 60 * 1000) return "urgent";
  return "normal";
}

export function toFormDateTime(isoDate: string): { date: string; time: string } {
  const date = new Date(isoDate);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return { date: `${value("year")}-${value("month")}-${value("day")}`, time: `${value("hour")}:${value("minute")}` };
}

export function fromFormDateTime(date: string, time: string): string {
  return new Date(`${date}T${time}:00-03:00`).toISOString();
}

export function shiftMonth(reference: Date, amount: number): Date {
  const copy = new Date(reference);
  copy.setDate(15);
  copy.setMonth(copy.getMonth() + amount);
  return copy;
}
