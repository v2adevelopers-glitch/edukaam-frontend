import { API_ENDPOINTS, USE_DEMO_DATA } from "../config/apiConfig";
import { apiClient } from "./api-client.service";
import { demoCities } from "../demo/demo-cities";

import type {
  CityDetailResponse,
  CityFilter,
  CityListResponse,
} from "../types/cities.types";

const endpoints = API_ENDPOINTS.cities;

const failure = (error: unknown, fallback: string) => ({
  success: false,
  statusCode: 500,
  message: error instanceof Error ? error.message : fallback,
  resData: null,
});

// Read-only lookup: the backend exposes list and details only.
export const citiesService = {
  async list(filter: CityFilter): Promise<CityListResponse> {
    if (USE_DEMO_DATA) return demoCities.list(filter);
    try {
      const params = new URLSearchParams();
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.set(key, String(value));
        }
      });

      return await apiClient<CityListResponse>(endpoints.list(params.toString()), {
        method: "GET",
        cache: "no-store",
      });
    } catch (error) {
      return failure(error, "Failed to load cities due to an unexpected error.") as unknown as CityListResponse;
    }
  },

  async details(id: number | string): Promise<CityDetailResponse> {
    if (USE_DEMO_DATA) return demoCities.details(id);
    try {
      return await apiClient<CityDetailResponse>(endpoints.details(id), {
        method: "GET",
        cache: "no-store",
      });
    } catch (error) {
      return failure(error, "Failed to load city details due to an unexpected error.") as unknown as CityDetailResponse;
    }
  },
};
