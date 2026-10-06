import type { Pagination } from "./common.types";

export type JobType = "full_time" | "part_time" | "contract" | "visiting";
export type JobStatus = "open" | "closed";
export type Board = "cbse" | "icse" | "state_board" | "ib" | "igcse" | "university" | "competitive";

// Provider's own jobs (GET /jobs)
export interface JobFilter {
  page: number;
  limit: number;
  search?: string; // title, job code
  job_category_id?: number | string;
  job_type?: JobType | "";
  status?: JobStatus | "";
}

export interface Job {
  id: number;
  job_code: string;
  provider_id: number;
  title: string;
  job_category_id: number;
  job_category_name?: string;
  job_category_is_teaching?: boolean;
  subject: string; // teaching jobs only, "" otherwise
  board: Board | ""; // teaching jobs only, "" otherwise
  job_type: JobType;
  vacancies: number;
  min_qualification: string;
  min_experience: number;
  salary_min: number;
  salary_max: number;
  state_id: number;
  state_name?: string;
  city_id: number;
  city_name?: string;
  last_date: string; // YYYY-MM-DD
  description: string;
  status: JobStatus;
  applicants_count?: number;
  hired_count?: number;
  created_at: string;
  updated_at: string;
}

export interface JobListResponse {
  statusCode: number;
  success: boolean;
  message: string;
  resData: { data: Job[]; pagination: Pagination };
}

export interface JobPayload {
  title: string;
  job_category_id: number | null;
  subject: string;
  board: Board | "";
  job_type: JobType | "";
  vacancies: number | null;
  min_qualification: string;
  min_experience: number | null;
  salary_min: number | null;
  salary_max: number | null;
  state_id: number | null;
  city_id: number | null;
  last_date: string;
  description: string;
  status: JobStatus;
}

export interface JobDetailResponse {
  success: boolean;
  statusCode: number;
  message: string;
  resData: { data: Job } | Job;
}

export interface JobMutationResponse {
  success: boolean;
  statusCode: number;
  message: string;
  resData: unknown;
}

// Open jobs for the logged-in seeker (GET /jobs/openings). The backend always limits these to
// the seeker's own job category; job_category_id is echoed back so the UI can show it.
export interface OpeningFilter {
  page: number;
  limit: number;
  search?: string; // title, institution name
  institution_type_id?: number | string;
  job_type?: JobType | "";
  state_id?: number | string;
  city_id?: number | string;
  subject?: string;
  board?: Board | "";
}

export interface Opening extends Job {
  institution_name: string;
  institution_type_id: number | null;
  institution_type_name?: string;
  institution_city_name?: string;
  institution_state_name?: string;
  institution_website?: string;
  institution_about?: string;
  institution_address?: string;
  institution_established_year?: number | null;
  has_applied: boolean;
  // compared with the seeker's profile; null when the job or the profile has no subject/board
  subject_match: boolean | null;
  board_match: boolean | null;
  application_status?: string | null;
  is_expired: boolean;
}

export interface OpeningListResponse {
  statusCode: number;
  success: boolean;
  message: string;
  resData: {
    data: Opening[];
    pagination: Pagination;
    job_category_id?: number | null;
    job_category_name?: string;
    job_category_is_teaching?: boolean;
  };
}

export interface OpeningDetailResponse {
  success: boolean;
  statusCode: number;
  message: string;
  resData: { data: Opening } | Opening;
}
