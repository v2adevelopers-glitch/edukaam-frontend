import { API_BASE_URL } from "../config/apiConfig";
import { authStorageService } from "./auth-storage.service";

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  resData: T;
}

interface ApiRequestOptions extends RequestInit {
  token?: string;
  isAuthenticated?: boolean;
}

export async function apiClient<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  try {
    if (!API_BASE_URL) {
      throw new Error("API_BASE_URL is not configured.");
    }

    const { token, isAuthenticated = false, headers, ...requestOptions } = options;

    const accessToken = token ?? (isAuthenticated ? authStorageService.getToken() : null);

    if (isAuthenticated && !accessToken) {
      throw new Error("Authentication token is missing.");
    }

    const requestHeaders = new Headers(headers);
    requestHeaders.set("Accept", "application/json");

    // Do not set Content-Type for FormData; the browser adds the multipart boundary.
    if (requestOptions.body && !(requestOptions.body instanceof FormData)) {
      requestHeaders.set("Content-Type", "application/json");
    }

    if (accessToken) {
      requestHeaders.set("x-access-token", accessToken);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...requestOptions,
      headers: requestHeaders,
    });

    const data = await response.json().catch(() => null);

    if (response.status === 401) {
      authStorageService.clearAuthentication();
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      }
      return {
        ...data,
        success: false,
        statusCode: response.status,
        message: data?.message ?? "Your session has expired. Please log in again.",
      } as T;
    }

    if (!response.ok) {
      return {
        ...data,
        success: false,
        statusCode: response.status,
        message: data?.message ?? `API request failed with status ${response.status}.`,
      } as T;
    }

    return data as T;
  } catch (error) {
    return {
      success: false,
      statusCode: 500,
      message: error instanceof Error ? error.message : "An unexpected error occurred while calling the API.",
      resData: null,
    } as T;
  }
}
