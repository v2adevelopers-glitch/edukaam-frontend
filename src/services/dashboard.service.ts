import { API_ENDPOINTS, USE_DEMO_DATA } from "../config/apiConfig";
import { apiClient } from "./api-client.service";
import { demoDashboard } from "../demo/demo-dashboard";

import type { ProviderDashboardResponse, SeekerDashboardResponse } from "../types/dashboard.types";

const endpoints = API_ENDPOINTS.dashboard;

const failure = (error: unknown, fallback: string) => ({
  success: false,
  statusCode: 500,
  message: error instanceof Error ? error.message : fallback,
  resData: null,
});

export const dashboardService = {
  async provider(): Promise<ProviderDashboardResponse> {
    if (USE_DEMO_DATA) return demoDashboard.provider();
    try {
      return await apiClient<ProviderDashboardResponse>(endpoints.provider, {
        method: "GET",
        isAuthenticated: true,
        cache: "no-store",
      });
    } catch (error) {
      return failure(error, "Failed to load the dashboard due to an unexpected error.") as ProviderDashboardResponse;
    }
  },

  async seeker(): Promise<SeekerDashboardResponse> {
    if (USE_DEMO_DATA) return demoDashboard.seeker();
    try {
      return await apiClient<SeekerDashboardResponse>(endpoints.seeker, {
        method: "GET",
        isAuthenticated: true,
        cache: "no-store",
      });
    } catch (error) {
      return failure(error, "Failed to load the dashboard due to an unexpected error.") as SeekerDashboardResponse;
    }
  },
};
