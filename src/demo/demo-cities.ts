/*
 * DEMO ONLY. Read-only city lookup (filtered by state).
 */
import type { CityDetailResponse, CityFilter, CityListResponse } from "../types/cities.types";
import { getDb } from "./demo-db";
import { listQuery } from "./demo-list";
import { fail, ok } from "./demo-response";
import { stateName } from "./demo-views";

export const demoCities = {
  async list(filter: CityFilter): Promise<CityListResponse> {
    const db = getDb();
    const rows = [...db.cities]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => ({ ...c, state_name: stateName(db, c.state_id) }));
    return ok("Records loaded", listQuery(rows, { limit: 100, ...filter }, { searchFields: ["name"], exactFields: ["state_id", "status"] }));
  },

  async details(id: number | string): Promise<CityDetailResponse> {
    const db = getDb();
    const row = db.cities.find((r) => String(r.id) === String(id));
    if (!row) return fail("Record not found.", 404);
    return ok("Record loaded", { data: { ...row, state_name: stateName(db, row.state_id) } });
  },
};
