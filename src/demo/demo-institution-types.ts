/*
 * DEMO ONLY. Read-only institution type lookup.
 */
import type { InstitutionTypeDetailResponse, InstitutionTypeFilter, InstitutionTypeListResponse } from "../types/institution-types.types";
import { getDb } from "./demo-db";
import { listQuery } from "./demo-list";
import { fail, ok } from "./demo-response";

export const demoInstitutionTypes = {
  async list(filter: InstitutionTypeFilter): Promise<InstitutionTypeListResponse> {
    const rows = [...getDb().institution_types].sort((a, b) => a.name.localeCompare(b.name));
    return ok("Records loaded", listQuery(rows, { limit: 100, ...filter }, { searchFields: ["name"], exactFields: ["status"] }));
  },

  async details(id: number | string): Promise<InstitutionTypeDetailResponse> {
    const row = getDb().institution_types.find((r) => String(r.id) === String(id));
    if (!row) return fail("Record not found.", 404);
    return ok("Record loaded", { data: row });
  },
};
