/*
 * DEMO ONLY. Jobs: a provider manages only their own jobs; a seeker browses open jobs of their own
 * job category (openings).
 */
import type {
  JobDetailResponse, JobFilter, JobListResponse, JobMutationResponse, JobPayload,
  OpeningDetailResponse, OpeningFilter, OpeningListResponse,
} from "../types/jobs.types";
import { getDb, makeCode, nextId, nowIso, todayYmd, updateDb, type DemoDb, type DemoJob } from "./demo-db";
import { listQuery } from "./demo-list";
import { fail, ok, SESSION_EXPIRED } from "./demo-response";
import { currentUserWithRole } from "./demo-session";
import { byNewest, categoryName, hiredCount, jobView, openingView, seekerProfileOf } from "./demo-views";

const JOB_TYPES = ["full_time", "part_time", "contract", "visiting"];
const JOB_STATUSES = ["open", "closed"];

const isNum = (v: unknown) => v !== null && v !== undefined && v !== "" && !Number.isNaN(Number(v));

const validateJob = (db: DemoDb, j: Partial<JobPayload>): string | null => {
  if (!String(j.title ?? "").trim()) return "Job title is required.";
  if (!db.job_categories.some((c) => c.id === Number(j.job_category_id))) return "Job category is required.";
  if (!JOB_TYPES.includes(String(j.job_type))) return "Job type is required.";
  if (!isNum(j.vacancies) || Number(j.vacancies) < 1 || !Number.isInteger(Number(j.vacancies))) return "Vacancies must be at least 1.";
  if (!String(j.min_qualification ?? "").trim()) return "Minimum qualification is required.";
  if (!isNum(j.min_experience) || Number(j.min_experience) < 0) return "Minimum experience cannot be negative.";
  if (!isNum(j.salary_min) || Number(j.salary_min) < 0) return "Minimum salary cannot be negative.";
  if (!isNum(j.salary_max) || Number(j.salary_max) < 0) return "Maximum salary cannot be negative.";
  if (Number(j.salary_max) < Number(j.salary_min)) return "Maximum salary must be greater than or equal to minimum salary.";
  if (!db.states.some((s) => s.id === Number(j.state_id))) return "State is required.";
  if (!db.cities.some((c) => c.id === Number(j.city_id) && c.state_id === Number(j.state_id))) return "City is required.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(j.last_date ?? ""))) return "Last date to apply is required.";
  if (!String(j.description ?? "").trim()) return "Description is required.";
  if (!JOB_STATUSES.includes(String(j.status))) return "Status must be open or closed.";
  return null;
};

const normalise = (p: Partial<JobPayload>) => {
  const out: Partial<DemoJob> = {};
  if (p.title !== undefined) out.title = String(p.title).trim();
  if (p.job_category_id !== undefined) out.job_category_id = Number(p.job_category_id);
  if (p.job_type !== undefined) out.job_type = p.job_type as DemoJob["job_type"];
  if (p.vacancies !== undefined) out.vacancies = Number(p.vacancies);
  if (p.min_qualification !== undefined) out.min_qualification = String(p.min_qualification).trim();
  if (p.min_experience !== undefined) out.min_experience = Number(p.min_experience);
  if (p.salary_min !== undefined) out.salary_min = Number(p.salary_min);
  if (p.salary_max !== undefined) out.salary_max = Number(p.salary_max);
  if (p.state_id !== undefined) out.state_id = Number(p.state_id);
  if (p.city_id !== undefined) out.city_id = Number(p.city_id);
  if (p.last_date !== undefined) out.last_date = String(p.last_date);
  if (p.description !== undefined) out.description = String(p.description).trim();
  if (p.status !== undefined) out.status = p.status;
  return out;
};

export const demoJobs = {
  /* ---------- provider: own jobs ---------- */

  async list(filter: JobFilter): Promise<JobListResponse> {
    const user = currentUserWithRole("job_provider");
    if (!user) return fail(SESSION_EXPIRED, 401);
    const db = getDb();
    const rows = db.jobs.filter((j) => j.provider_id === user.id).sort(byNewest).map((j) => jobView(db, j));
    return ok("Jobs loaded", listQuery(rows, filter as unknown as Record<string, unknown>, {
      searchFields: ["title", "job_code"],
      exactFields: ["job_category_id", "job_type", "status"],
    }));
  },

  async details(id: number | string): Promise<JobDetailResponse> {
    const user = currentUserWithRole("job_provider");
    if (!user) return fail(SESSION_EXPIRED, 401);
    const db = getDb();
    const job = db.jobs.find((j) => String(j.id) === String(id) && j.provider_id === user.id);
    if (!job) return fail("Job not found.", 404);
    return ok("Job loaded", { data: jobView(db, job) });
  },

  async create(payload: JobPayload): Promise<JobMutationResponse> {
    const user = currentUserWithRole("job_provider");
    if (!user) return fail(SESSION_EXPIRED, 401);
    const db = getDb();
    const error = validateJob(db, payload);
    if (error) return fail(error, 422);
    if (payload.last_date < todayYmd()) return fail("Last date to apply cannot be in the past.", 422);

    const created = updateDb((d) => {
      const id = nextId(d.jobs);
      const job: DemoJob = {
        ...(normalise(payload) as DemoJob),
        id, job_code: makeCode("JOB", id), provider_id: user.id, created_at: nowIso(), updated_at: nowIso(),
      };
      d.jobs.push(job);
      return job;
    });
    return ok(`Job "${created.title}" posted successfully.`, { data: jobView(getDb(), created) }, 201);
  },

  async update(id: number | string, payload: Partial<JobPayload>): Promise<JobMutationResponse> {
    const user = currentUserWithRole("job_provider");
    if (!user) return fail(SESSION_EXPIRED, 401);
    const db = getDb();
    const job = db.jobs.find((j) => String(j.id) === String(id) && j.provider_id === user.id);
    if (!job) return fail("Job not found.", 404);

    const merged = { ...job, ...normalise(payload) };
    const error = validateJob(db, merged as unknown as JobPayload);
    if (error) return fail(error, 422);
    if (payload.last_date !== undefined && payload.last_date !== job.last_date && payload.last_date < todayYmd()) {
      return fail("Last date to apply cannot be in the past.", 422);
    }
    const hired = hiredCount(db, job.id);
    if (merged.vacancies < hired) {
      return fail(`${hired} applicant(s) are already hired for this job, so vacancies cannot be less than ${hired}.`, 422);
    }
    if (merged.status === "open" && hired >= merged.vacancies) {
      return fail(`All ${merged.vacancies} vacancies for this job are already filled. Increase the vacancies to reopen it.`, 422);
    }

    const updated = updateDb((d) => {
      const target = d.jobs.find((j) => j.id === job.id) as DemoJob;
      Object.assign(target, normalise(payload), { updated_at: nowIso() });
      return target;
    });
    const statusOnly = Object.keys(payload).length === 1 && payload.status !== undefined;
    return ok(statusOnly ? `Job marked as ${updated.status}.` : `Job "${updated.title}" updated successfully.`, { data: jobView(getDb(), updated) });
  },

  async delete(id: number | string): Promise<JobMutationResponse> {
    const user = currentUserWithRole("job_provider");
    if (!user) return fail(SESSION_EXPIRED, 401);
    const db = getDb();
    const job = db.jobs.find((j) => String(j.id) === String(id) && j.provider_id === user.id);
    if (!job) return fail("Job not found.", 404);
    const applicants = db.applications.filter((a) => a.job_id === job.id).length;
    if (applicants > 0) {
      return fail(`"${job.title}" already has ${applicants} applicant(s), so it cannot be deleted. Close the job instead.`, 409);
    }
    updateDb((d) => {
      d.jobs = d.jobs.filter((j) => j.id !== job.id);
    });
    return ok(`Job "${job.title}" deleted.`, null);
  },

  /* ---------- seeker: open jobs in their own category ---------- */

  async openings(filter: OpeningFilter): Promise<OpeningListResponse> {
    const user = currentUserWithRole("job_seeker");
    if (!user) return fail(SESSION_EXPIRED, 401);
    const db = getDb();
    const categoryId = seekerProfileOf(db, user.id)?.job_category_id ?? null;
    const rows = db.jobs
      .filter((j) => j.status === "open" && j.job_category_id === categoryId)
      .map((j) => openingView(db, j, user.id))
      // still-open jobs first, newest first within each group
      .sort((a, b) => Number(a.is_expired) - Number(b.is_expired) || byNewest(a, b));
    const result = listQuery(rows, filter as unknown as Record<string, unknown>, {
      searchFields: ["title", "institution_name", "job_code"],
      exactFields: ["institution_type_id", "job_type", "state_id", "city_id"],
    });
    return ok("Open jobs loaded", { ...result, job_category_id: categoryId, job_category_name: categoryName(db, categoryId) });
  },

  async openingDetails(id: number | string): Promise<OpeningDetailResponse> {
    const user = currentUserWithRole("job_seeker");
    if (!user) return fail(SESSION_EXPIRED, 401);
    const db = getDb();
    const job = db.jobs.find((j) => String(j.id) === String(id));
    const applied = job ? db.applications.some((a) => a.job_id === job.id && a.seeker_id === user.id) : false;
    if (!job || (job.status !== "open" && !applied)) return fail("Job not found or no longer open.", 404);
    return ok("Job loaded", { data: openingView(db, job, user.id) });
  },
};
