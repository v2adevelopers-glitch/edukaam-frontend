/*
 * DEMO ONLY. Builds the standard { success, statusCode, message, resData } response after a short
 * random delay, so loaders and overlays are visible exactly as with a real backend.
 */
import { authStorageService } from "../services/auth-storage.service";

export const SESSION_EXPIRED = "Your session has expired. Please log in again.";

const simulateLatency = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 300 + Math.floor(Math.random() * 201)));

export const ok = async <T>(message: string, resData: T, statusCode = 200) => {
  await simulateLatency();
  return { success: true, statusCode, message, resData };
};

// Typed as the caller's response type so handlers can `return fail(...)` from any method.
export const fail = async <T = any>(message: string, statusCode = 400): Promise<T> => {
  await simulateLatency();
  if (statusCode === 401) {
    // same behaviour as apiClient on a 401: drop the session and go to the login page
    authStorageService.clearAuthentication();
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.replace("/login");
    }
  }
  return { success: false, statusCode, message, resData: null } as unknown as T;
};
