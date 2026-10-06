import type { Pagination, RecordStatus } from "./common.types";

export interface CityFilter {
  page: number;
  limit?: number;
  search?: string; // name
  state_id?: number;
  status?: RecordStatus;
}

export interface City {
  id: number;
  state_id: number;
  state_name?: string;
  name: string;
  status: RecordStatus;
}

export interface CityListResponse {
  statusCode: number;
  success: boolean;
  message: string;
  resData: { data: City[]; pagination: Pagination };
}

export interface CityDetailResponse {
  success: boolean;
  statusCode: number;
  message: string;
  resData: { data: City } | City;
}
