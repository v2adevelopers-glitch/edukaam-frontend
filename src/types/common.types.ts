export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MutationResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  resData: T;
}

export type RecordStatus = "active" | "inactive";
