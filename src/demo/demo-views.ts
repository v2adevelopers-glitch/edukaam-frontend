/*
 * DEMO ONLY. Joins stored rows with lookups (names for ids, counts) the way API responses would.
 */
import type { Job, Opening } from "../types/jobs.types";
import type { Application, ApplicationDetail } from "../types/applications.types";
import type { ProviderProfile } from "../types/provider-profile.types";
import type { SeekerProfile } from "../types/seeker-profile.types";
import { todayYmd, type DemoApplication, type DemoDb, type DemoJob, type DemoProviderProfile, type DemoSeekerProfile } from "./demo-db";

export const categoryName = (db: DemoDb, id: number | null | undefined) => db.job_categories.find((c) => c.id === id)?.name ?? "";
export const institutionTypeName = (db: DemoDb, id: number | null | undefined) => db.institution_types.find((t) => t.id === id)?.name ?? "";
export const stateName = (db: DemoDb, id: number | null | undefined) => db.states.find((s) => s.id === id)?.name ?? "";
export const cityName = (db: DemoDb, id: number | null | undefined) => db.cities.find((c) => c.id === id)?.name ?? "";

export const providerProfileOf = (db: DemoDb, userId: number) => db.provider_profiles.find((p) => p.user_id === userId);
export const seekerProfileOf = (db: DemoDb, userId: number) => db.seeker_profiles.find((p) => p.user_id === userId);

export const isExpired = (job: DemoJob) => job.last_date < todayYmd();

export const hiredCount = (db: DemoDb, jobId: number) =>
  db.applications.filter((a) => a.job_id === jobId && a.status === "hired").length;

export const providerProfileView = (db: DemoDb, p: DemoProviderProfile): ProviderProfile => ({
  ...p,
  institution_type_name: institutionTypeName(db, p.institution_type_id),
  state_name: stateName(db, p.state_id),
  city_name: cityName(db, p.city_id),
});

export const seekerProfileView = (db: DemoDb, p: DemoSeekerProfile): SeekerProfile => ({
  ...p,
  job_category_name: categoryName(db, p.job_category_id),
  state_name: stateName(db, p.state_id),
  city_name: cityName(db, p.city_id),
});

export const jobView = (db: DemoDb, job: DemoJob): Job => {
  const apps = db.applications.filter((a) => a.job_id === job.id);
  return {
    ...job,
    job_category_name: categoryName(db, job.job_category_id),
    state_name: stateName(db, job.state_id),
    city_name: cityName(db, job.city_id),
    applicants_count: apps.length,
    hired_count: apps.filter((a) => a.status === "hired").length,
  };
};

export const openingView = (db: DemoDb, job: DemoJob, seekerUserId: number): Opening => {
  const provider = providerProfileOf(db, job.provider_id);
  const application = db.applications.find((a) => a.job_id === job.id && a.seeker_id === seekerUserId);
  const base = jobView(db, job);
  return {
    ...base,
    applicants_count: undefined, // other applicants are the provider's business
    hired_count: undefined,
    institution_name: provider?.institution_name ?? "",
    institution_type_id: provider?.institution_type_id ?? null,
    institution_type_name: institutionTypeName(db, provider?.institution_type_id),
    institution_city_name: cityName(db, provider?.city_id),
    institution_state_name: stateName(db, provider?.state_id),
    institution_website: provider?.website ?? "",
    institution_about: provider?.about ?? "",
    institution_address: provider?.address ?? "",
    institution_established_year: provider?.established_year ?? null,
    has_applied: Boolean(application),
    application_status: application?.status ?? null,
    is_expired: isExpired(job),
  };
};

export const applicationView = (db: DemoDb, app: DemoApplication): Application => {
  const job = db.jobs.find((j) => j.id === app.job_id);
  const seeker = seekerProfileOf(db, app.seeker_id);
  const provider = job ? providerProfileOf(db, job.provider_id) : undefined;
  return {
    ...app,
    job_code: job?.job_code,
    job_title: job?.title,
    job_type: job?.job_type,
    job_status: job?.status,
    job_category_id: job?.job_category_id,
    job_category_name: categoryName(db, job?.job_category_id),
    job_city_name: cityName(db, job?.city_id),
    job_state_name: stateName(db, job?.state_id),
    institution_name: provider?.institution_name,
    institution_type_name: institutionTypeName(db, provider?.institution_type_id),
    seeker_code: seeker?.seeker_code,
    seeker_name: seeker?.full_name,
    seeker_mobile: seeker?.mobile,
    seeker_email: seeker?.email,
    seeker_experience_years: seeker?.experience_years ?? null,
    seeker_qualification: seeker?.highest_qualification,
  };
};

// Provider view: the full seeker profile. Seeker view: the full job.
export const applicationDetailView = (db: DemoDb, app: DemoApplication, forRole: "job_provider" | "job_seeker"): ApplicationDetail => {
  const base = applicationView(db, app);
  if (forRole === "job_provider") {
    const s = seekerProfileOf(db, app.seeker_id);
    return {
      ...base,
      seeker_gender: s?.gender ?? "",
      seeker_dob: s?.dob ?? "",
      seeker_category_name: categoryName(db, s?.job_category_id),
      seeker_skills: s?.skills ?? "",
      seeker_expected_salary: s?.expected_salary ?? null,
      seeker_city_name: cityName(db, s?.city_id),
      seeker_state_name: stateName(db, s?.state_id),
      seeker_about: s?.about ?? "",
    };
  }
  const job = db.jobs.find((j) => j.id === app.job_id);
  return {
    ...base,
    // a seeker sees their own contact details only through their profile
    seeker_mobile: undefined,
    seeker_email: undefined,
    job_vacancies: job?.vacancies,
    job_min_qualification: job?.min_qualification,
    job_min_experience: job?.min_experience,
    job_salary_min: job?.salary_min,
    job_salary_max: job?.salary_max,
    job_last_date: job?.last_date,
    job_description: job?.description,
  };
};

// newest first
export const byNewest = <T extends { created_at?: string; applied_on?: string }>(a: T, b: T) =>
  String(b.created_at ?? b.applied_on ?? "").localeCompare(String(a.created_at ?? a.applied_on ?? ""));
