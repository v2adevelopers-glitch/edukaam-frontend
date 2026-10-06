import { API_ENDPOINTS, USE_DEMO_DATA } from "../config/apiConfig";
import { apiClient } from "./api-client.service";
import { authStorageService } from "./auth-storage.service";
import { demoSeekerProfile } from "../demo/demo-seeker-profile";

import type {
  SeekerProfile,
  SeekerProfileDetailResponse,
  SeekerProfileMutationResponse,
  SeekerProfilePayload,
} from "../types/seeker-profile.types";

const endpoints = API_ENDPOINTS.seekerProfile;

const failure = (error: unknown, fallback: string) => ({
  success: false,
  statusCode: 500,
  message: error instanceof Error ? error.message : fallback,
  resData: null,
});

// Keep the stored user and profile in step with the saved profile so a refresh shows the new values
const syncStoredProfile = (profile: SeekerProfile | undefined, name: string, mobile: string) => {
  const token = authStorageService.getToken();
  const user = authStorageService.getUser();
  if (token && user && profile) {
    authStorageService.saveAuthentication(token, { ...user, name, mobile }, profile);
  }
};

// Single-record resource: the logged-in user's own profile.
export const seekerProfileService = {
  async details(): Promise<SeekerProfileDetailResponse> {
    if (USE_DEMO_DATA) return demoSeekerProfile.details();
    try {
      return await apiClient<SeekerProfileDetailResponse>(endpoints.details, {
        method: "GET",
        isAuthenticated: true,
        cache: "no-store",
      });
    } catch (error) {
      return failure(error, "Failed to load profile due to an unexpected error.") as unknown as SeekerProfileDetailResponse;
    }
  },

  async update(payload: SeekerProfilePayload): Promise<SeekerProfileMutationResponse> {
    try {
      const res = USE_DEMO_DATA
        ? await demoSeekerProfile.update(payload)
        : await apiClient<SeekerProfileMutationResponse>(endpoints.update, {
          method: "PATCH",
          body: JSON.stringify(payload),
          isAuthenticated: true,
        });
      if (res?.success) {
        const saved = res.resData?.data;
        syncStoredProfile(saved, saved?.full_name ?? payload.full_name, saved?.mobile ?? payload.mobile);
      }
      return res;
    } catch (error) {
      return failure(error, "Failed to update profile due to an unexpected error.") as SeekerProfileMutationResponse;
    }
  },
};
