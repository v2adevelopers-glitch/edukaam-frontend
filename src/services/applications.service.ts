import { API_ENDPOINTS, USE_DEMO_DATA } from "../config/apiConfig";
import { apiClient } from "./api-client.service";
import { demoApplications } from "../demo/demo-applications";

import type {
  ApplicationDetailResponse,
  ApplicationFilter,
  ApplicationListResponse,
  ApplicationMutationResponse,
  ApplicationPayload,
  ApplicationStatusPayload,
} from "../types/applications.types";

const endpoints = API_ENDPOINTS.applications;

const failure = (error: unknown, fallback: string) => ({
  success: false,
  statusCode: 500,
  message: error instanceof Error ? error.message : fallback,
  resData: null,
});

// The backend scopes every call by the token: providers see applications on their own jobs,
// seekers see their own applications.
export const applicationsService = {
  async list(filter: ApplicationFilter): Promise<ApplicationListResponse> {
    if (USE_DEMO_DATA) return demoApplications.list(filter);
    try {
      const params = new URLSearchParams();
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.set(key, String(value));
        }
      });

      return await apiClient<ApplicationListResponse>(endpoints.list(params.toString()), {
        method: "GET",
        isAuthenticated: true,
        cache: "no-store",
      });
    } catch (error) {
      return failure(error, "Failed to load applications due to an unexpected error.") as unknown as ApplicationListResponse;
    }
  },

  async details(id: number | string): Promise<ApplicationDetailResponse> {
    if (USE_DEMO_DATA) return demoApplications.details(id);
    try {
      return await apiClient<ApplicationDetailResponse>(endpoints.details(id), {
        method: "GET",
        isAuthenticated: true,
        cache: "no-store",
      });
    } catch (error) {
      return failure(error, "Failed to load application details due to an unexpected error.") as unknown as ApplicationDetailResponse;
    }
  },

  // Seeker: apply for a job
  async create(payload: ApplicationPayload): Promise<ApplicationMutationResponse> {
    if (USE_DEMO_DATA) return demoApplications.create(payload);
    try {
      return await apiClient<ApplicationMutationResponse>(endpoints.create, {
        method: "POST",
        body: JSON.stringify(payload),
        isAuthenticated: true,
      });
    } catch (error) {
      return failure(error, "Failed to send the application due to an unexpected error.") as ApplicationMutationResponse;
    }
  },

  // Provider: change the application status (send interview details with "interview")
  async update(id: number | string, payload: ApplicationStatusPayload): Promise<ApplicationMutationResponse> {
    if (USE_DEMO_DATA) return demoApplications.update(id, payload);
    try {
      return await apiClient<ApplicationMutationResponse>(endpoints.update(id), {
        method: "PATCH",
        body: JSON.stringify(payload),
        isAuthenticated: true,
      });
    } catch (error) {
      return failure(error, "Failed to update the application due to an unexpected error.") as ApplicationMutationResponse;
    }
  },

  async updateStatus(id: number | string, payload: ApplicationStatusPayload): Promise<ApplicationMutationResponse> {
    return applicationsService.update(id, payload);
  },

  // Seeker: withdraw an application that is still "applied"
  async delete(id: number | string): Promise<ApplicationMutationResponse> {
    if (USE_DEMO_DATA) return demoApplications.delete(id);
    try {
      return await apiClient<ApplicationMutationResponse>(endpoints.delete(id), {
        method: "DELETE",
        isAuthenticated: true,
      });
    } catch (error) {
      return failure(error, "Failed to withdraw the application due to an unexpected error.") as ApplicationMutationResponse;
    }
  },
};
