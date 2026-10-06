import { API_ENDPOINTS, USE_DEMO_DATA } from "../config/apiConfig";
import { apiClient } from "./api-client.service";
import { authStorageService } from "./auth-storage.service";
import { demoProviderProfile } from "../demo/demo-provider-profile";

import type {
  ProviderProfile,
  ProviderProfileDetailResponse,
  ProviderProfileMutationResponse,
  ProviderProfilePayload,
} from "../types/provider-profile.types";

const endpoints = API_ENDPOINTS.providerProfile;

const failure = (error: unknown, fallback: string) => ({
  success: false,
  statusCode: 500,
  message: error instanceof Error ? error.message : fallback,
  resData: null,
});

// Keep the stored user and profile in step with the saved profile so a refresh shows the new values
const syncStoredProfile = (profile: ProviderProfile | undefined, name: string, mobile: string) => {
  const token = authStorageService.getToken();
  const user = authStorageService.getUser();
  if (token && user && profile) {
    authStorageService.saveAuthentication(token, { ...user, name, mobile }, profile);
  }
};

// Single-record resource: the logged-in user's own institution profile.
export const providerProfileService = {
  async details(): Promise<ProviderProfileDetailResponse> {
    if (USE_DEMO_DATA) return demoProviderProfile.details();
    try {
      return await apiClient<ProviderProfileDetailResponse>(endpoints.details, {
        method: "GET",
        isAuthenticated: true,
        cache: "no-store",
      });
    } catch (error) {
      return failure(error, "Failed to load institution profile due to an unexpected error.") as unknown as ProviderProfileDetailResponse;
    }
  },

  async update(payload: ProviderProfilePayload): Promise<ProviderProfileMutationResponse> {
    try {
      const res = USE_DEMO_DATA
        ? await demoProviderProfile.update(payload)
        : await apiClient<ProviderProfileMutationResponse>(endpoints.update, {
          method: "PATCH",
          body: JSON.stringify(payload),
          isAuthenticated: true,
        });
      if (res?.success) {
        const saved = res.resData?.data;
        syncStoredProfile(saved, saved?.institution_name ?? payload.institution_name, saved?.mobile ?? payload.mobile);
      }
      return res;
    } catch (error) {
      return failure(error, "Failed to update institution profile due to an unexpected error.") as ProviderProfileMutationResponse;
    }
  },
};
