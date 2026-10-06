import type { UserRoleCode } from "../config/siteConfig";
import type { ProviderProfile } from "./provider-profile.types";
import type { SeekerProfile } from "./seeker-profile.types";

export interface UserInfo {
  id: number;
  user_code: string;
  name: string;
  email: string;
  mobile: string;
  role_code: UserRoleCode;
  status: "active" | "inactive";
  created_at: string;
}

export type UserProfileInfo = ProviderProfile | SeekerProfile;

export interface RoleInfo {
  role_code: UserRoleCode;
  role_name: string;
}

export interface MenuItem {
  menu_id: number;
  title: string;
  icon: string; // bootstrap-icons class, e.g. "bi-grid"
  path: string; // e.g. "/jobs/list"
  heading?: string; // optional group label shown above this item
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  statusCode: number;
  message: string;
  resData: {
    token: string;
    user_info: UserInfo;
    profile_res: UserProfileInfo;
    role_info: RoleInfo;
  } | null;
}

export interface SignupPayload {
  role_code: UserRoleCode;
  name: string; // institution name for providers
  mobile: string;
  email: string;
  password: string;
  job_category_id?: number; // job_seeker only
  institution_type_id?: number; // job_provider only
}

export interface SignupResponse {
  success: boolean;
  statusCode: number;
  message: string;
  resData: { user_info: UserInfo } | null;
}

export interface VerifyTokenResponse {
  success: boolean;
  statusCode: number;
  message: string;
  resData: {
    user_info: UserInfo;
    profile_res: UserProfileInfo;
    menu_access: MenuItem[];
    role_info: RoleInfo;
  } | null;
}

export interface MenuAccessResponse {
  success: boolean;
  statusCode: number;
  message: string;
  resData: MenuItem[] | null;
}
