import { API_ENDPOINTS, USE_DEMO_DATA } from "../config/apiConfig";
import { apiClient } from "./api-client.service";
import { demoJobCategories } from "../demo/demo-job-categories";

import type {
  JobCategoryDetailResponse,
  JobCategoryFilter,
  JobCategoryListResponse,
} from "../types/job-categories.types";

const endpoints = API_ENDPOINTS.jobCategories;

const failure = (error: unknown, fallback: string) => ({
  success: false,
  statusCode: 500,
  message: error instanceof Error ? error.message : fallback,
  resData: null,
});

// Read-only lookup: the backend exposes list and details only.
export const jobCategoriesService = {
  async list(filter: JobCategoryFilter): Promise<JobCategoryListResponse> {
    if (USE_DEMO_DATA) return demoJobCategories.list(filter);
    try {
      const params = new URLSearchParams();
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.set(key, String(value));
        }
      });

      return await apiClient<JobCategoryListResponse>(endpoints.list(params.toString()), {
        method: "GET",
        cache: "no-store",
      });
    } catch (error) {
      return failure(error, "Failed to load job categories due to an unexpected error.") as unknown as JobCategoryListResponse;
    }
  },

  async details(id: number | string): Promise<JobCategoryDetailResponse> {
    if (USE_DEMO_DATA) return demoJobCategories.details(id);
    try {
      return await apiClient<JobCategoryDetailResponse>(endpoints.details(id), {
        method: "GET",
        cache: "no-store",
      });
    } catch (error) {
      return failure(error, "Failed to load job category details due to an unexpected error.") as unknown as JobCategoryDetailResponse;
    }
  },
};
