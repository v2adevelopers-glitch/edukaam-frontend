import type { UserInfo, UserProfileInfo } from "../types/authentication.types";

const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user";
const AUTH_PROFILE_KEY = "auth_user_profile";

const isBrowser = (): boolean => typeof window !== "undefined";

const readJson = <T>(key: string): T | null => {
  if (!isBrowser()) return null;
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as T;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
};

export const authStorageService = {
  saveAuthentication(token: string, user: UserInfo, profile: UserProfileInfo): void {
    if (!isBrowser()) return;
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(profile));
  },
  getToken(): string | null {
    return isBrowser() ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
  },
  getUser(): UserInfo | null {
    return readJson<UserInfo>(AUTH_USER_KEY);
  },
  getUserProfile(): UserProfileInfo | null {
    return readJson<UserProfileInfo>(AUTH_PROFILE_KEY);
  },
  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  },
  clearAuthentication(): void {
    if (!isBrowser()) return;
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_PROFILE_KEY);
  },
};
