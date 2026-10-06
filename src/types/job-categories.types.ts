import type { Pagination, RecordStatus } from "./common.types";

export interface JobCategoryFilter {
  page: number;
  limit?: number;
  search?: string; // name, code
  status?: RecordStatus;
}

export interface JobCategory {
  id: number;
  code: string;
  name: string;
  is_teaching: boolean; // teaching jobs carry a subject and a board
  status: RecordStatus;
}

export interface JobCategoryListResponse {
  statusCode: number;
  success: boolean;
  message: string;
  resData: { data: JobCategory[]; pagination: Pagination };
}

export interface JobCategoryDetailResponse {
  success: boolean;
  statusCode: number;
  message: string;
  resData: { data: JobCategory } | JobCategory;
}
