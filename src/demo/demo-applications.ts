/*
 * DEMO ONLY. Applications, scoped by the caller's role:
 *  - job_provider: applications received on their own jobs; can change the status (and hire)
 *  - job_seeker:   their own applications; can apply and withdraw while still "applied"
 */
import type {
  ApplicationDetailResponse, ApplicationFilter, ApplicationListResponse, ApplicationMutationResponse,
  ApplicationPayload, ApplicationStatus,
} from "../types/applications.types";
import { getDb, makeCode, nextId, nowIso, updateDb, type DemoApplication, type DemoDb } from "./demo-db";
import { listQuery } from "./demo-list";
import { fail, ok, SESSION_EXPIRED } from "./demo-response";
import { currentUser } from "./demo-session";
import { applicationDetailView, applicationView, byNewest, isExpired, providerProfileOf, seekerProfileOf } from "./demo-views";

const STATUSES: ApplicationStatus[] = ["applied", "shortlisted", "interview", "hired", "rejected"];
const STATUS_LABEL: Record<ApplicationStatus, string> = {
  applied: "Applied", shortlisted: "Shortlisted", interview: "Interview", hired: "Hired", rejected: "Rejected",
};

// applications the caller is allowed to see
const visibleTo = (db: DemoDb, user: { id: number; role_code: string }): DemoApplication[] => {
  if (user.role_code === "job_provider") {
    const ownJobIds = new Set(db.jobs.filter((j) => j.provider_id === user.id).map((j) => j.id));
    return db.applications.filter((a) => ownJobIds.has(a.job_id));
  }
  return db.applications.filter((a) => a.seeker_id === user.id);
};

export const demoApplications = {
  async list(filter: ApplicationFilter): Promise<ApplicationListResponse> {
    const user = currentUser();
    if (!user) return fail(SESSION_EXPIRED, 401);
    const db = getDb();
    const rows = visibleTo(db, user).sort(byNewest).map((a) => applicationView(db, a));
    const isProvider = user.role_code === "job_provider";
    return ok("Applications loaded", listQuery(rows, filter as unknown as Record<string, unknown>, isProvider
      ? { searchFields: ["seeker_name", "seeker_mobile", "seeker_code", "application_code"], exactFields: ["job_id", "status", "job_category_id"] }
      : { searchFields: ["job_title", "institution_name", "job_code", "application_code"], exactFields: ["status"] }));
  },

  async details(id: number | string): Promise<ApplicationDetailResponse> {
    const user = currentUser();
    if (!user) return fail(SESSION_EXPIRED, 401);
    const db = getDb();
    const app = visibleTo(db, user).find((a) => String(a.id) === String(id));
    if (!app) return fail("Application not found.", 404);
    return ok("Application loaded", { data: applicationDetailView(db, app, user.role_code) });
  },

  // seeker applies for a job
  async create(payload: ApplicationPayload): Promise<ApplicationMutationResponse> {
    const user = currentUser();
    if (!user) return fail(SESSION_EXPIRED, 401);
    if (user.role_code !== "job_seeker") return fail("Only job seekers can apply for jobs.", 403);
    const db = getDb();
    const job = db.jobs.find((j) => j.id === Number(payload?.job_id));
    if (!job) return fail("Job not found.", 404);
    if (db.applications.some((a) => a.job_id === job.id && a.seeker_id === user.id)) {
      return fail(`You have already applied for "${job.title}".`, 409);
    }
    if (job.status !== "open") return fail("This job is closed and no longer accepts applications.", 422);
    if (isExpired(job)) return fail("The last date to apply for this job has passed.", 422);
    if (seekerProfileOf(db, user.id)?.job_category_id !== job.job_category_id) {
      return fail("This job is not in your job category.", 422);
    }
    const created = updateDb((d) => {
      const id = nextId(d.applications);
      const app: DemoApplication = {
        id, application_code: makeCode("APP", id), job_id: job.id, seeker_id: user.id,
        status: "applied", applied_on: nowIso(), updated_at: nowIso(),
      };
      d.applications.push(app);
      return app;
    });
    const institution = providerProfileOf(db, job.provider_id)?.institution_name ?? "the institution";
    return ok(`Application for "${job.title}" sent to ${institution}.`, { data: applicationView(getDb(), created) }, 201);
  },

  // provider changes the application status; filling the last vacancy closes the job
  async update(id: number | string, payload: { status: ApplicationStatus }): Promise<ApplicationMutationResponse> {
    const user = currentUser();
    if (!user) return fail(SESSION_EXPIRED, 401);
    if (user.role_code !== "job_provider") return fail("Only the institution can change an application status.", 403);
    const db = getDb();
    const app = visibleTo(db, user).find((a) => String(a.id) === String(id));
    if (!app) return fail("Application not found.", 404);
    const status = payload?.status;
    if (!STATUSES.includes(status)) return fail("Invalid application status.", 422);
    if (status === app.status) return ok(`Status is already ${STATUS_LABEL[status]}.`, { data: applicationView(db, app) });

    const job = db.jobs.find((j) => j.id === app.job_id);
    if (!job) return fail("Job not found.", 404);
    const hiredOthers = db.applications.filter((a) => a.job_id === job.id && a.status === "hired" && a.id !== app.id).length;
    if (status === "hired" && hiredOthers >= job.vacancies) {
      return fail(`All ${job.vacancies} vacancies for "${job.title}" are already filled. Increase the vacancies to hire more.`, 422);
    }

    const result = updateDb((d) => {
      const target = d.applications.find((a) => a.id === app.id) as DemoApplication;
      target.status = status;
      target.updated_at = nowIso();
      const targetJob = d.jobs.find((j) => j.id === job.id);
      let jobClosed = false;
      if (status === "hired" && targetJob && targetJob.status === "open" && hiredOthers + 1 >= targetJob.vacancies) {
        targetJob.status = "closed";
        targetJob.updated_at = nowIso();
        jobClosed = true;
      }
      return { target, jobClosed };
    });

    const name = seekerProfileOf(db, app.seeker_id)?.full_name ?? "Applicant";
    return ok(
      status === "hired" ? `${name} has been hired.` : `${name} marked as ${STATUS_LABEL[status]}.`,
      { data: applicationView(getDb(), result.target), job_closed: result.jobClosed, job_title: job.title, job_vacancies: job.vacancies },
    );
  },

  // seeker withdraws an application that is still "applied"
  async delete(id: number | string): Promise<ApplicationMutationResponse> {
    const user = currentUser();
    if (!user) return fail(SESSION_EXPIRED, 401);
    if (user.role_code !== "job_seeker") return fail("Only the applicant can withdraw an application.", 403);
    const db = getDb();
    const app = db.applications.find((a) => String(a.id) === String(id) && a.seeker_id === user.id);
    if (!app) return fail("Application not found.", 404);
    if (app.status !== "applied") {
      return fail(`This application is already ${STATUS_LABEL[app.status]} and can no longer be withdrawn.`, 422);
    }
    updateDb((d) => {
      d.applications = d.applications.filter((a) => a.id !== app.id);
    });
    const title = db.jobs.find((j) => j.id === app.job_id)?.title ?? "the job";
    return ok(`Application for "${title}" withdrawn.`, null);
  },
};
