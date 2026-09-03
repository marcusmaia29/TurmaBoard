import { getCalendarKeys, getCalendarQueryRange } from "./calendar.utils";

describe("calendar grid", () => {
  it("builds six complete Monday-to-Sunday weeks", () => {
    const keys = getCalendarKeys(new Date("2026-08-15T12:00:00-03:00"));
    expect(keys).toHaveLength(42);
    expect(keys[0]).toBe("2026-07-27");
    expect(keys[41]).toBe("2026-09-06");
  });

  it("queries every visible day, including adjacent months", () => {
    expect(getCalendarQueryRange(new Date("2026-08-15T12:00:00-03:00"))).toEqual({
      startIso: "2026-07-27T00:00:00-03:00",
      endIso: "2026-09-07T00:00:00-03:00",
    });
  });
});
