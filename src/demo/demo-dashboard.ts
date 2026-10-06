/*
 * DEMO ONLY. Dashboard summaries for each role.
 */
import type { ProviderDashboardResponse, SeekerDashboardResponse, StatusBreakdown } from "../types/dashboard.types";
import type { DemoApplication } from "./demo-db";
import { getDb } from "./demo-db";
import { fail, ok, SESSION_EXPIRED } from "./demo-response";
import { currentUserWithRole } from "./demo-session";
import { byNewest, categoryName, isExpired, openingView, seekerProfileOf } from "./demo-views";

const breakdown = (apps: DemoApplication[]): StatusBreakdown => {
  const out: StatusBreakdown = { applied: 0, shortlisted: 0, interview: 0, hired: 0, rejected: 0 };
  apps.forEach((a) => {
    out[a.status] += 1;
  });
  return out;
};

export const demoDashboard = {
  async provider(): Promise<ProviderDashboardResponse> {
    const user = currentUserWithRole("job_provider");
    if (!user) return fail(SESSION_EXPIRED, 401);
    const db = getDb();
    const jobs = db.jobs.filter((j) => j.provider_id === user.id);
    const jobIds = new Set(jobs.map((j) => j.id));
    const apps = db.applications.filter((a) => jobIds.has(a.job_id));
    const byStatus = breakdown(apps);

    const topJobs = jobs
      .map((j) => ({ job_id: j.id, job_code: j.job_code, title: j.title, applicants: apps.filter((a) => a.job_id === j.id).length }))
      .filter((j) => j.applicants > 0)
      .sort((a, b) => b.applicants - a.applicants || a.title.localeCompare(b.title))
      .slice(0, 5);

    const recent = [...apps].sort(byNewest).slice(0, 5).map((a) => ({
      id: a.id,
      application_code: a.application_code,
      seeker_name: seekerProfileOf(db, a.seeker_id)?.full_name ?? "",
      job_title: jobs.find((j) => j.id === a.job_id)?.title ?? "",
      status: a.status,
      applied_on: a.applied_on,
    }));

    return ok("Dashboard loaded", {
      open_jobs: jobs.filter((j) => j.status === "open").length,
      total_jobs: jobs.length,
      total_applicants: apps.length,
      shortlisted: byStatus.shortlisted,
      hired: byStatus.hired,
      applications_by_status: byStatus,
      top_jobs: topJobs,
      recent_applicants: recent,
    });
  },

  async seeker(): Promise<SeekerDashboardResponse> {
    const user = currentUserWithRole("job_seeker");
    if (!user) return fail(SESSION_EXPIRED, 401);
    const db = getDb();
    const apps = db.applications.filter((a) => a.seeker_id === user.id);
    const byStatus = breakdown(apps);
    const categoryId = seekerProfileOf(db, user.id)?.job_category_id ?? null;
    const newest = db.jobs
      .filter((j) => j.status === "open" && j.job_category_id === categoryId && !isExpired(j))
      .sort(byNewest)
      .slice(0, 5)
      .map((j) => openingView(db, j, user.id));

    return ok("Dashboard loaded", {
      job_category_name: categoryName(db, categoryId),
      applications_sent: apps.length,
      shortlisted: byStatus.shortlisted,
      hired: byStatus.hired,
      applications_by_status: byStatus,
      newest_jobs: newest,
    });
  },
};
