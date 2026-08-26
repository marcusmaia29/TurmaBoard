import { describe, expect, it } from "vitest";
import { findGradeSession, getInitialGradeDay, gradeDays, gradeSessions, gradeSlots } from "./grade.data";

describe("grade data", () => {
  it("covers five weekdays, five time slots, and every session from the source", () => {
    expect(gradeDays).toHaveLength(5);
    expect(gradeSlots).toHaveLength(5);
    expect(gradeSessions).toHaveLength(15);
    expect(findGradeSession("wednesday", "slot-1")).toMatchObject({ kind: "office-hours", start: "08:00", end: "09:30" });
    expect(findGradeSession("friday", "slot-4")).toMatchObject({ subjectCode: "SHS", start: "14:15", end: "16:15" });
  });

  it("opens the current weekday and falls back to Monday on weekends", () => {
    expect(getInitialGradeDay(new Date("2026-08-26T12:00:00"))).toBe("wednesday");
    expect(getInitialGradeDay(new Date("2026-08-29T12:00:00"))).toBe("monday");
  });
});
