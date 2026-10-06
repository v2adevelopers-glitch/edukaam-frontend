import { API_ENDPOINTS, USE_DEMO_DATA } from "../config/apiConfig";
import { apiClient } from "./api-client.service";
import { demoStates } from "../demo/demo-states";

import type {
  StateDetailResponse,
  StateFilter,
  StateListResponse,
} from "../types/states.types";

const endpoints = API_ENDPOINTS.states;

const failure = (error: unknown, fallback: string) => ({
  success: false,
  statusCode: 500,
  message: error instanceof Error ? error.message : fallback,
  resData: null,
});

// Read-only lookup: the backend exposes list and details only.
export const statesService = {
  async list(filter: StateFilter): Promise<StateListResponse> {
    if (USE_DEMO_DATA) return demoStates.list(filter);
    try {
      const params = new URLSearchParams();
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.set(key, String(value));
        }
      });

      return await apiClient<StateListResponse>(endpoints.list(params.toString()), {
        method: "GET",
        cache: "no-store",
      });
    } catch (error) {
      return failure(error, "Failed to load states due to an unexpected error.") as unknown as StateListResponse;
    }
  },

  async details(id: number | string): Promise<StateDetailResponse> {
    if (USE_DEMO_DATA) return demoStates.details(id);
    try {
      return await apiClient<StateDetailResponse>(endpoints.details(id), {
        method: "GET",
        cache: "no-store",
      });
    } catch (error) {
      return failure(error, "Failed to load state details due to an unexpected error.") as unknown as StateDetailResponse;
    }
  },
};
