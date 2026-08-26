import type { Profile } from "../../lib/database.types";
import { hasAdminRole } from "./auth.utils";

const baseProfile: Profile = {
  id: "profile-id",
  display_name: "Pessoa da turma",
  role: "member",
  created_at: "2026-08-26T12:00:00-03:00",
  updated_at: "2026-08-26T12:00:00-03:00",
};

describe("hasAdminRole", () => {
  it("does not authorize an authenticated member", () => {
    expect(hasAdminRole(baseProfile)).toBe(false);
  });

  it("authorizes only a profile with the admin role", () => {
    expect(hasAdminRole({ ...baseProfile, role: "admin" })).toBe(true);
    expect(hasAdminRole(null)).toBe(false);
  });
});
