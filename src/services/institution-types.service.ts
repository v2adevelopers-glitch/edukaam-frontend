import { API_ENDPOINTS, USE_DEMO_DATA } from "../config/apiConfig";
import { apiClient } from "./api-client.service";
import { demoInstitutionTypes } from "../demo/demo-institution-types";

import type {
  InstitutionTypeDetailResponse,
  InstitutionTypeFilter,
  InstitutionTypeListResponse,
} from "../types/institution-types.types";

const endpoints = API_ENDPOINTS.institutionTypes;

const failure = (error: unknown, fallback: string) => ({
  success: false,
  statusCode: 500,
  message: error instanceof Error ? error.message : fallback,
  resData: null,
});

// Read-only lookup: the backend exposes list and details only.
export const institutionTypesService = {
  async list(filter: InstitutionTypeFilter): Promise<InstitutionTypeListResponse> {
    if (USE_DEMO_DATA) return demoInstitutionTypes.list(filter);
    try {
      const params = new URLSearchParams();
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.set(key, String(value));
        }
      });

      return await apiClient<InstitutionTypeListResponse>(endpoints.list(params.toString()), {
        method: "GET",
        cache: "no-store",
      });
    } catch (error) {
      return failure(error, "Failed to load institution types due to an unexpected error.") as unknown as InstitutionTypeListResponse;
    }
  },

  async details(id: number | string): Promise<InstitutionTypeDetailResponse> {
    if (USE_DEMO_DATA) return demoInstitutionTypes.details(id);
    try {
      return await apiClient<InstitutionTypeDetailResponse>(endpoints.details(id), {
        method: "GET",
        cache: "no-store",
      });
    } catch (error) {
      return failure(error, "Failed to load institution type details due to an unexpected error.") as unknown as InstitutionTypeDetailResponse;
    }
  },
};
