import { API_ENDPOINTS, USE_DEMO_DATA } from "../config/apiConfig";
import { apiClient } from "./api-client.service";
import { authStorageService } from "./auth-storage.service";
import { demoAuthentication } from "../demo/demo-authentication";

import type {
  LoginPayload,
  LoginResponse,
  MenuAccessResponse,
  SignupPayload,
  SignupResponse,
  VerifyTokenResponse,
} from "../types/authentication.types";

const endpoints = API_ENDPOINTS.authentication;

const failure = (error: unknown, fallback: string) => ({
  success: false,
  statusCode: 500,
  message: error instanceof Error ? error.message : fallback,
  resData: null,
});

export const authenticationService = {
  // Saves token, user and profile through authStorageService on success.
  async login(payload: LoginPayload): Promise<LoginResponse> {
    try {
      const res = USE_DEMO_DATA
        ? await demoAuthentication.login(payload)
        : await apiClient<LoginResponse>(endpoints.login, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      if (res?.success && res.resData?.token) {
        authStorageService.saveAuthentication(res.resData.token, res.resData.user_info, res.resData.profile_res);
      }
      return res;
    } catch (error) {
      return failure(error, "Failed to log in due to an unexpected error.") as LoginResponse;
    }
  },

  async signup(payload: SignupPayload): Promise<SignupResponse> {
    if (USE_DEMO_DATA) return demoAuthentication.signup(payload);
    try {
      return await apiClient<SignupResponse>(endpoints.signup, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (error) {
      return failure(error, "Failed to sign up due to an unexpected error.") as SignupResponse;
    }
  },

  async verifyToken(): Promise<VerifyTokenResponse> {
    if (USE_DEMO_DATA) return demoAuthentication.verifyToken();
    try {
      return await apiClient<VerifyTokenResponse>(endpoints.verifyToken, {
        method: "GET",
        isAuthenticated: true,
        cache: "no-store",
      });
    } catch (error) {
      return failure(error, "Failed to verify the session due to an unexpected error.") as VerifyTokenResponse;
    }
  },

  async getMenuAccess(roleCode: string): Promise<MenuAccessResponse> {
    if (USE_DEMO_DATA) return demoAuthentication.getMenuAccess(roleCode);
    try {
      return await apiClient<MenuAccessResponse>(endpoints.menuAccess(roleCode), {
        method: "GET",
        isAuthenticated: true,
        cache: "no-store",
      });
    } catch (error) {
      return failure(error, "Failed to load menu access due to an unexpected error.") as MenuAccessResponse;
    }
  },
};
