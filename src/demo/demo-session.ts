/*
 * DEMO ONLY. Fake tokens and the "who is calling" lookup that the demo handlers use to enforce
 * ownership, just like a backend would read the user from x-access-token.
 */
import { authStorageService } from "../services/auth-storage.service";
import type { UserRoleCode } from "../config/siteConfig";
import { getDb, type DemoUser } from "./demo-db";

const TOKEN_PREFIX = "demo.";

export const issueToken = (user: DemoUser): string =>
  `${TOKEN_PREFIX}${btoa(JSON.stringify({ uid: user.id, role: user.role_code, iat: Date.now() }))}`;

export const userFromToken = (token: string | null): DemoUser | null => {
  if (!token || !token.startsWith(TOKEN_PREFIX)) return null;
  try {
    const payload = JSON.parse(atob(token.slice(TOKEN_PREFIX.length)));
    const user = getDb().users.find((u) => u.id === payload?.uid);
    return user && user.status === "active" ? user : null;
  } catch {
    return null;
  }
};

// The logged-in user, read from the token held by authStorageService
export const currentUser = (): DemoUser | null => userFromToken(authStorageService.getToken());

export const currentUserWithRole = (role: UserRoleCode): DemoUser | null => {
  const user = currentUser();
  return user?.role_code === role ? user : null;
};
