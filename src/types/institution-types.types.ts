import type { Pagination, RecordStatus } from "./common.types";

export interface InstitutionTypeFilter {
  page: number;
  limit?: number;
  search?: string; // name, code
  status?: RecordStatus;
}

export interface InstitutionType {
  id: number;
  code: string;
  name: string;
  status: RecordStatus;
}

export interface InstitutionTypeListResponse {
  statusCode: number;
  success: boolean;
  message: string;
  resData: { data: InstitutionType[]; pagination: Pagination };
}

export interface InstitutionTypeDetailResponse {
  success: boolean;
  statusCode: number;
  message: string;
  resData: { data: InstitutionType } | InstitutionType;
}
