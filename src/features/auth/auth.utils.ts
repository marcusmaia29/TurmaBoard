import type { Profile } from "../../lib/database.types";

export function hasAdminRole(profile: Profile | null): boolean {
  return profile?.role === "admin";
}
