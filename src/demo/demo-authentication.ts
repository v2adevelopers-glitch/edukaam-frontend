/*
 * DEMO ONLY. Login, signup, token check and role menus.
 */
import { USER_ROLES, ROLE_LABELS, type UserRoleCode } from "../config/siteConfig";
import type {
  LoginPayload, LoginResponse, MenuAccessResponse, MenuItem, SignupPayload, SignupResponse,
  UserInfo, UserProfileInfo, VerifyTokenResponse,
} from "../types/authentication.types";
import { getDb, makeCode, nextId, nowIso, updateDb, type DemoUser } from "./demo-db";
import { fail, ok, SESSION_EXPIRED } from "./demo-response";
import { currentUser, issueToken } from "./demo-session";
import { providerProfileOf, providerProfileView, seekerProfileOf, seekerProfileView } from "./demo-views";

// What the backend's menu API returns per role (rendered by SideBar.jsx)
const MENUS: Record<UserRoleCode, MenuItem[]> = {
  job_provider: [
    { menu_id: 1, title: "Dashboard", icon: "bi-grid", path: "/" },
    { menu_id: 2, title: "Institution Profile", icon: "bi-building", path: "/profile/view" },
    { menu_id: 3, title: "Post a Job", icon: "bi-plus-square", path: "/jobs/add", heading: "Hiring" },
    { menu_id: 4, title: "My Jobs", icon: "bi-briefcase", path: "/jobs/list" },
    { menu_id: 5, title: "Applicants", icon: "bi-people", path: "/applications/list" },
  ],
  job_seeker: [
    { menu_id: 11, title: "Dashboard", icon: "bi-grid", path: "/" },
    { menu_id: 12, title: "My Profile", icon: "bi-person-badge", path: "/profile/view" },
    { menu_id: 13, title: "Find Jobs", icon: "bi-search", path: "/openings/list", heading: "Jobs" },
    { menu_id: 14, title: "My Applications", icon: "bi-send", path: "/my-applications/list" },
  ],
};

const isRole = (role: unknown): role is UserRoleCode =>
  role === USER_ROLES.JOB_PROVIDER || role === USER_ROLES.JOB_SEEKER;

const toUserInfo = (u: DemoUser): UserInfo => {
  const { password, ...info } = u;
  return info;
};

const profileFor = (u: DemoUser): UserProfileInfo | null => {
  const db = getDb();
  if (u.role_code === USER_ROLES.JOB_PROVIDER) {
    const p = providerProfileOf(db, u.id);
    return p ? providerProfileView(db, p) : null;
  }
  const s = seekerProfileOf(db, u.id);
  return s ? seekerProfileView(db, s) : null;
};

const roleInfo = (role: UserRoleCode) => ({ role_code: role, role_name: ROLE_LABELS[role] });

export const demoAuthentication = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const email = String(payload?.email ?? "").trim().toLowerCase();
    const user = getDb().users.find((u) => u.email.toLowerCase() === email);
    if (!user || user.password !== payload?.password) {
      return fail("Invalid email or password.", 400);
    }
    if (user.status !== "active") return fail("This account is inactive.", 403);
    const profile = profileFor(user);
    if (!profile) return fail("Profile not found for this account.", 404);
    return ok("Login successful", {
      token: issueToken(user),
      user_info: toUserInfo(user),
      profile_res: profile,
      role_info: roleInfo(user.role_code),
    });
  },

  async signup(payload: SignupPayload): Promise<SignupResponse> {
    const db = getDb();
    const name = String(payload?.name ?? "").trim();
    const email = String(payload?.email ?? "").trim().toLowerCase();
    const mobile = String(payload?.mobile ?? "");
    if (!isRole(payload?.role_code)) return fail("Choose whether you are hiring or looking for a job.", 422);
    if (!name) return fail("Name is required.", 422);
    if (!/^\d{10}$/.test(mobile)) return fail("Enter a valid 10 digit mobile number.", 422);
    if (!/^\S+@\S+\.\S+$/.test(email)) return fail("Enter a valid email address.", 422);
    if (String(payload?.password ?? "").length < 8) return fail("Password must be at least 8 characters.", 422);
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      return fail("An account with this email already exists. Please log in.", 409);
    }
    const isProvider = payload.role_code === USER_ROLES.JOB_PROVIDER;
    if (isProvider && !db.institution_types.some((t) => t.id === Number(payload.institution_type_id))) {
      return fail("Institution type is required.", 422);
    }
    if (!isProvider && !db.job_categories.some((c) => c.id === Number(payload.job_category_id))) {
      return fail("Job category is required.", 422);
    }

    const user = updateDb((d) => {
      const id = nextId(d.users);
      const created: DemoUser = {
        id, user_code: makeCode("USR", id), role_code: payload.role_code, name, email, mobile,
        password: String(payload.password), status: "active", created_at: nowIso(),
      };
      d.users.push(created);
      if (isProvider) {
        const pid = nextId(d.provider_profiles);
        d.provider_profiles.push({
          id: pid, user_id: id, provider_code: makeCode("INST", pid, 3), institution_name: name,
          institution_type_id: Number(payload.institution_type_id), contact_person: "", designation: "",
          mobile, email, established_year: null, website: "", about: "", address: "",
          state_id: null, city_id: null, pincode: "", updated_at: nowIso(),
        });
      } else {
        const sid = nextId(d.seeker_profiles);
        d.seeker_profiles.push({
          id: sid, user_id: id, seeker_code: makeCode("SKR", sid), full_name: name, mobile, email,
          gender: "", dob: "", job_category_id: Number(payload.job_category_id), highest_qualification: "",
          experience_years: null, skills: "", expected_salary: null, state_id: null, city_id: null,
          about: "", updated_at: nowIso(),
        });
      }
      return created;
    });
    return ok("Your account has been created. Please log in to continue.", { user_info: toUserInfo(user) }, 201);
  },

  async verifyToken(): Promise<VerifyTokenResponse> {
    const user = currentUser();
    const profile = user ? profileFor(user) : null;
    if (!user || !profile) return fail(SESSION_EXPIRED, 401);
    return ok("Token verified", {
      user_info: toUserInfo(user),
      profile_res: profile,
      menu_access: MENUS[user.role_code],
      role_info: roleInfo(user.role_code),
    });
  },

  async getMenuAccess(roleCode: string): Promise<MenuAccessResponse> {
    if (!isRole(roleCode)) return fail("Unknown role.", 404);
    return ok("Menu access loaded", MENUS[roleCode]);
  },
};
