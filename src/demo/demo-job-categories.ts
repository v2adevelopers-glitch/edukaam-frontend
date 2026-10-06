/*
 * DEMO ONLY. Read-only job category lookup.
 */
import type { JobCategoryDetailResponse, JobCategoryFilter, JobCategoryListResponse } from "../types/job-categories.types";
import { getDb } from "./demo-db";
import { listQuery } from "./demo-list";
import { fail, ok } from "./demo-response";

export const demoJobCategories = {
  async list(filter: JobCategoryFilter): Promise<JobCategoryListResponse> {
    const rows = [...getDb().job_categories].sort((a, b) => a.name.localeCompare(b.name));
    return ok("Records loaded", listQuery(rows, { limit: 100, ...filter }, { searchFields: ["name"], exactFields: ["status"] }));
  },

  async details(id: number | string): Promise<JobCategoryDetailResponse> {
    const row = getDb().job_categories.find((r) => String(r.id) === String(id));
    if (!row) return fail("Record not found.", 404);
    return ok("Record loaded", { data: row });
  },
};
