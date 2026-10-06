import type { Pagination, RecordStatus } from "./common.types";

export interface StateFilter {
  page: number;
  limit?: number;
  search?: string; // name
  status?: RecordStatus;
}

export interface State {
  id: number;
  name: string;
  status: RecordStatus;
}

export interface StateListResponse {
  statusCode: number;
  success: boolean;
  message: string;
  resData: { data: State[]; pagination: Pagination };
}

export interface StateDetailResponse {
  success: boolean;
  statusCode: number;
  message: string;
  resData: { data: State } | State;
}
