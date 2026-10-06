import type { ApplicationStatus } from "./applications.types";
import type { Opening } from "./jobs.types";

export type StatusBreakdown = Record<ApplicationStatus, number>;

export interface ProviderDashboard {
  open_jobs: number;
  total_jobs: number;
  total_applicants: number;
  shortlisted: number;
  hired: number;
  applications_by_status: StatusBreakdown;
  top_jobs: { job_id: number; job_code: string; title: string; applicants: number }[];
  recent_applicants: {
    id: number;
    application_code: string;
    seeker_name: string;
    job_title: string;
    status: ApplicationStatus;
    applied_on: string;
  }[];
}

export interface SeekerDashboard {
  job_category_name: string;
  applications_sent: number;
  shortlisted: number;
  hired: number;
  applications_by_status: StatusBreakdown;
  newest_jobs: Opening[];
}

export interface ProviderDashboardResponse {
  success: boolean;
  statusCode: number;
  message: string;
  resData: ProviderDashboard | null;
}

export interface SeekerDashboardResponse {
  success: boolean;
  statusCode: number;
  message: string;
  resData: SeekerDashboard | null;
}
