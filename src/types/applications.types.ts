import type { Pagination } from "./common.types";
import type { JobType, JobStatus } from "./jobs.types";
import type { Gender } from "./seeker-profile.types";

export type ApplicationStatus = "applied" | "shortlisted" | "interview" | "hired" | "rejected";

// GET /applications is scoped by the token: a provider receives the applications on their own
// jobs, a seeker receives their own applications.
export interface ApplicationFilter {
  page: number;
  limit: number;
  search?: string; // provider: applicant name, mobile; seeker: job title, institution
  job_id?: number | string; // provider only
  job_category_id?: number | string; // provider only
  status?: ApplicationStatus | "";
}

export interface Application {
  id: number;
  application_code: string;
  job_id: number;
  seeker_id: number;
  status: ApplicationStatus;
  applied_on: string; // ISO datetime
  updated_at: string;

  // job side
  job_code?: string;
  job_title?: string;
  job_type?: JobType;
  job_status?: JobStatus;
  job_category_id?: number;
  job_category_name?: string;
  job_city_name?: string;
  job_state_name?: string;
  institution_name?: string;
  institution_type_name?: string;

  // seeker side (provider view)
  seeker_code?: string;
  seeker_name?: string;
  seeker_mobile?: string;
  seeker_email?: string;
  seeker_experience_years?: number | null;
  seeker_qualification?: string;
}

export interface ApplicationDetail extends Application {
  // provider view: full seeker profile
  seeker_gender?: Gender | "";
  seeker_dob?: string;
  seeker_category_name?: string;
  seeker_skills?: string;
  seeker_expected_salary?: number | null;
  seeker_city_name?: string;
  seeker_state_name?: string;
  seeker_about?: string;

  // seeker view: job details
  job_vacancies?: number;
  job_min_qualification?: string;
  job_min_experience?: number;
  job_salary_min?: number;
  job_salary_max?: number;
  job_last_date?: string;
  job_description?: string;
}

export interface ApplicationListResponse {
  statusCode: number;
  success: boolean;
  message: string;
  resData: { data: Application[]; pagination: Pagination };
}

export interface ApplicationDetailResponse {
  success: boolean;
  statusCode: number;
  message: string;
  resData: { data: ApplicationDetail } | ApplicationDetail;
}

export interface ApplicationPayload {
  job_id: number;
}

export interface ApplicationMutationResponse {
  success: boolean;
  statusCode: number;
  message: string;
  // job_closed is true when hiring filled the last vacancy and the job was closed automatically
  resData: { data?: Application; job_closed?: boolean; job_title?: string; job_vacancies?: number } | null;
}
