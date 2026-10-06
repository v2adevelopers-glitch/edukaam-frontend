export type Gender = "male" | "female" | "other";

export interface SeekerProfile {
  id: number;
  user_id: number;
  seeker_code: string;
  full_name: string;
  mobile: string;
  email: string;
  gender: Gender | "";
  dob: string; // YYYY-MM-DD
  job_category_id: number | null;
  job_category_name?: string;
  highest_qualification: string;
  experience_years: number | null;
  skills: string; // comma separated
  expected_salary: number | null; // INR per month
  state_id: number | null;
  state_name?: string;
  city_id: number | null;
  city_name?: string;
  about: string;
  updated_at: string;
}

export interface SeekerProfilePayload {
  full_name: string;
  mobile: string;
  gender: Gender | "";
  dob: string;
  job_category_id: number | null;
  highest_qualification: string;
  experience_years: number | null;
  skills: string;
  expected_salary: number | null;
  state_id: number | null;
  city_id: number | null;
  about: string;
}

export interface SeekerProfileDetailResponse {
  success: boolean;
  statusCode: number;
  message: string;
  resData: { data: SeekerProfile } | SeekerProfile;
}

export interface SeekerProfileMutationResponse {
  success: boolean;
  statusCode: number;
  message: string;
  resData: { data: SeekerProfile } | null;
}
