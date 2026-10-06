import { API_ENDPOINTS, USE_DEMO_DATA } from "../config/apiConfig";
import { apiClient } from "./api-client.service";
import { demoJobs } from "../demo/demo-jobs";

import type {
  JobDetailResponse,
  JobFilter,
  JobListResponse,
  JobMutationResponse,
  JobPayload,
  JobStatus,
  OpeningDetailResponse,
  OpeningFilter,
  OpeningListResponse,
} from "../types/jobs.types";

const endpoints = API_ENDPOINTS.jobs;

const failure = (error: unknown, fallback: string) => ({
  success: false,
  statusCode: 500,
  message: error instanceof Error ? error.message : fallback,
  resData: null,
});

const toQuery = (filter: object) => {
  const params = new URLSearchParams();
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  return params.toString();
};

export const jobsService = {
  // Provider: own jobs only (scoped by the token on the backend)
  async list(filter: JobFilter): Promise<JobListResponse> {
    if (USE_DEMO_DATA) return demoJobs.list(filter);
    try {
      return await apiClient<JobListResponse>(endpoints.list(toQuery(filter)), {
        method: "GET",
        isAuthenticated: true,
        cache: "no-store",
      });
    } catch (error) {
      return failure(error, "Failed to load jobs due to an unexpected error.") as unknown as JobListResponse;
    }
  },

  async details(id: number | string): Promise<JobDetailResponse> {
    if (USE_DEMO_DATA) return demoJobs.details(id);
    try {
      return await apiClient<JobDetailResponse>(endpoints.details(id), {
        method: "GET",
        isAuthenticated: true,
        cache: "no-store",
      });
    } catch (error) {
      return failure(error, "Failed to load job details due to an unexpected error.") as unknown as JobDetailResponse;
    }
  },

  async create(payload: JobPayload): Promise<JobMutationResponse> {
    if (USE_DEMO_DATA) return demoJobs.create(payload);
    try {
      return await apiClient<JobMutationResponse>(endpoints.create, {
        method: "POST",
        body: JSON.stringify(payload),
        isAuthenticated: true,
      });
    } catch (error) {
      return failure(error, "Failed to create job due to an unexpected error.") as JobMutationResponse;
    }
  },

  async update(id: number | string, payload: Partial<JobPayload>): Promise<JobMutationResponse> {
    if (USE_DEMO_DATA) return demoJobs.update(id, payload);
    try {
      return await apiClient<JobMutationResponse>(endpoints.update(id), {
        method: "PATCH",
        body: JSON.stringify(payload),
        isAuthenticated: true,
      });
    } catch (error) {
      return failure(error, "Failed to update job due to an unexpected error.") as JobMutationResponse;
    }
  },

  async updateStatus(id: number | string, payload: { status: JobStatus }): Promise<JobMutationResponse> {
    return jobsService.update(id, payload);
  },

  async delete(id: number | string): Promise<JobMutationResponse> {
    if (USE_DEMO_DATA) return demoJobs.delete(id);
    try {
      return await apiClient<JobMutationResponse>(endpoints.delete(id), {
        method: "DELETE",
        isAuthenticated: true,
      });
    } catch (error) {
      return failure(error, "Failed to delete job due to an unexpected error.") as JobMutationResponse;
    }
  },

  // Seeker: open jobs in the seeker's own job category
  async openings(filter: OpeningFilter): Promise<OpeningListResponse> {
    if (USE_DEMO_DATA) return demoJobs.openings(filter);
    try {
      return await apiClient<OpeningListResponse>(endpoints.openings(toQuery(filter)), {
        method: "GET",
        isAuthenticated: true,
        cache: "no-store",
      });
    } catch (error) {
      return failure(error, "Failed to load open jobs due to an unexpected error.") as unknown as OpeningListResponse;
    }
  },

  async openingDetails(id: number | string): Promise<OpeningDetailResponse> {
    if (USE_DEMO_DATA) return demoJobs.openingDetails(id);
    try {
      return await apiClient<OpeningDetailResponse>(endpoints.openingDetails(id), {
        method: "GET",
        isAuthenticated: true,
        cache: "no-store",
      });
    } catch (error) {
      return failure(error, "Failed to load job details due to an unexpected error.") as unknown as OpeningDetailResponse;
    }
  },
};
