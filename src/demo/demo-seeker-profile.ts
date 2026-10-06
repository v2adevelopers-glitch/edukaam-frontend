/*
 * DEMO ONLY. The logged-in job seeker's own profile.
 */
import type {
  SeekerProfileDetailResponse, SeekerProfileMutationResponse, SeekerProfilePayload,
} from "../types/seeker-profile.types";
import { getDb, nowIso, todayYmd, updateDb } from "./demo-db";
import { fail, ok, SESSION_EXPIRED } from "./demo-response";
import { currentUserWithRole } from "./demo-session";
import { seekerProfileOf, seekerProfileView } from "./demo-views";

const validate = (p: SeekerProfilePayload): string | null => {
  const db = getDb();
  if (!String(p?.full_name ?? "").trim()) return "Full name is required.";
  if (!/^\d{10}$/.test(String(p?.mobile ?? ""))) return "Enter a valid 10 digit mobile number.";
  if (p?.gender && !["male", "female", "other"].includes(p.gender)) return "Select a valid gender.";
  if (p?.dob && p.dob >= todayYmd()) return "Date of birth must be in the past.";
  if (!db.job_categories.some((c) => c.id === Number(p?.job_category_id))) return "Primary job category is required.";
  if (p?.experience_years !== null && p?.experience_years !== undefined && p.experience_years < 0) return "Experience cannot be negative.";
  if (p?.expected_salary !== null && p?.expected_salary !== undefined && p.expected_salary < 0) return "Expected salary cannot be negative.";
  if (p?.state_id && !db.states.some((s) => s.id === Number(p.state_id))) return "Select a valid state.";
  if (p?.city_id && !db.cities.some((c) => c.id === Number(p.city_id) && c.state_id === Number(p.state_id))) {
    return "Select a city in the chosen state.";
  }
  return null;
};

export const demoSeekerProfile = {
  async details(): Promise<SeekerProfileDetailResponse> {
    const user = currentUserWithRole("job_seeker");
    if (!user) return fail(SESSION_EXPIRED, 401);
    const db = getDb();
    const profile = seekerProfileOf(db, user.id);
    if (!profile) return fail("Profile not found.", 404);
    return ok("Profile loaded", { data: seekerProfileView(db, profile) });
  },

  async update(payload: SeekerProfilePayload): Promise<SeekerProfileMutationResponse> {
    const user = currentUserWithRole("job_seeker");
    if (!user) return fail(SESSION_EXPIRED, 401);
    const error = validate(payload);
    if (error) return fail(error, 422);

    const updated = updateDb((db) => {
      const profile = seekerProfileOf(db, user.id);
      if (!profile) return null;
      Object.assign(profile, {
        full_name: payload.full_name.trim(),
        mobile: payload.mobile,
        gender: payload.gender || "",
        dob: payload.dob || "",
        job_category_id: Number(payload.job_category_id),
        highest_qualification: String(payload.highest_qualification ?? "").trim(),
        experience_years: payload.experience_years ?? null,
        skills: String(payload.skills ?? "").split(",").map((s) => s.trim()).filter(Boolean).join(", "),
        expected_salary: payload.expected_salary ?? null,
        state_id: payload.state_id ? Number(payload.state_id) : null,
        city_id: payload.city_id ? Number(payload.city_id) : null,
        about: String(payload.about ?? "").trim(),
        updated_at: nowIso(),
      });
      const u = db.users.find((x) => x.id === user.id);
      if (u) {
        u.name = profile.full_name;
        u.mobile = profile.mobile;
      }
      return seekerProfileView(db, profile);
    });
    if (!updated) return fail("Profile not found.", 404);
    return ok("Profile updated successfully.", { data: updated });
  },
};
