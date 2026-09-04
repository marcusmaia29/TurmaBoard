import { addDays, formatWeekRange, getDeadlineTone, getMonthRange, getWeekRange, toDateKey } from "./date";

describe("date utilities", () => {
  it("builds a Monday-to-Sunday week in São Paulo", () => {
    const range = getWeekRange(new Date("2026-08-25T12:00:00-03:00"));
    expect(range.startKey).toBe("2026-08-24");
    expect(range.endKey).toBe("2026-08-30");
    expect(formatWeekRange(range.startKey, range.endKey)).toBe("24/08 a 30/08");
  });

  it("handles month and year boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(getMonthRange(new Date("2026-12-15T12:00:00-03:00"))).toMatchObject({
      startKey: "2026-12-01",
      endKey: "2027-01-01",
    });
  });

  it("uses the application timezone for date keys", () => {
    expect(toDateKey(new Date("2026-08-26T01:30:00Z"))).toBe("2026-08-25");
  });

  it("classifies overdue, urgent, and normal deadlines", () => {
    const now = new Date("2026-08-25T12:00:00-03:00");
    expect(getDeadlineTone("2026-08-25T11:59:00-03:00", now)).toBe("overdue");
    expect(getDeadlineTone("2026-08-26T11:59:00-03:00", now)).toBe("urgent");
    expect(getDeadlineTone("2026-08-27T12:00:00-03:00", now)).toBe("normal");
  });
});
