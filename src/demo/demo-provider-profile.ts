/*
 * DEMO ONLY. The logged-in institution's own profile.
 */
import type {
  ProviderProfileDetailResponse, ProviderProfileMutationResponse, ProviderProfilePayload,
} from "../types/provider-profile.types";
import { getDb, nowIso, updateDb } from "./demo-db";
import { fail, ok, SESSION_EXPIRED } from "./demo-response";
import { currentUserWithRole } from "./demo-session";
import { providerProfileOf, providerProfileView } from "./demo-views";

const validate = (p: ProviderProfilePayload): string | null => {
  const db = getDb();
  if (!String(p?.institution_name ?? "").trim()) return "Institution name is required.";
  if (!db.institution_types.some((t) => t.id === Number(p?.institution_type_id))) return "Institution type is required.";
  if (!/^\d{10}$/.test(String(p?.mobile ?? ""))) return "Enter a valid 10 digit mobile number.";
  const year = p?.established_year;
  if (year !== null && year !== undefined && (year < 1800 || year > new Date().getFullYear())) {
    return "Enter a valid established year.";
  }
  if (p?.state_id && !db.states.some((s) => s.id === Number(p.state_id))) return "Select a valid state.";
  if (p?.city_id && !db.cities.some((c) => c.id === Number(p.city_id) && c.state_id === Number(p.state_id))) {
    return "Select a city in the chosen state.";
  }
  if (p?.pincode && !/^\d{6}$/.test(p.pincode)) return "Enter a valid 6 digit pincode.";
  return null;
};

export const demoProviderProfile = {
  async details(): Promise<ProviderProfileDetailResponse> {
    const user = currentUserWithRole("job_provider");
    if (!user) return fail(SESSION_EXPIRED, 401);
    const db = getDb();
    const profile = providerProfileOf(db, user.id);
    if (!profile) return fail("Profile not found.", 404);
    return ok("Profile loaded", { data: providerProfileView(db, profile) });
  },

  async update(payload: ProviderProfilePayload): Promise<ProviderProfileMutationResponse> {
    const user = currentUserWithRole("job_provider");
    if (!user) return fail(SESSION_EXPIRED, 401);
    const error = validate(payload);
    if (error) return fail(error, 422);

    const updated = updateDb((db) => {
      const profile = providerProfileOf(db, user.id);
      if (!profile) return null;
      Object.assign(profile, {
        institution_name: payload.institution_name.trim(),
        institution_type_id: Number(payload.institution_type_id),
        contact_person: String(payload.contact_person ?? "").trim(),
        designation: String(payload.designation ?? "").trim(),
        mobile: payload.mobile,
        established_year: payload.established_year ?? null,
        website: String(payload.website ?? "").trim(),
        about: String(payload.about ?? "").trim(),
        address: String(payload.address ?? "").trim(),
        state_id: payload.state_id ? Number(payload.state_id) : null,
        city_id: payload.city_id ? Number(payload.city_id) : null,
        pincode: String(payload.pincode ?? ""),
        updated_at: nowIso(),
      });
      const u = db.users.find((x) => x.id === user.id);
      if (u) {
        u.name = profile.institution_name;
        u.mobile = profile.mobile;
      }
      return providerProfileView(db, profile);
    });
    if (!updated) return fail("Profile not found.", 404);
    return ok("Institution profile updated successfully.", { data: updated });
  },
};
