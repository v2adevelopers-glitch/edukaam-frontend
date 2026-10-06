/*
 * DEMO ONLY. Read-only state lookup.
 */
import type { StateDetailResponse, StateFilter, StateListResponse } from "../types/states.types";
import { getDb } from "./demo-db";
import { listQuery } from "./demo-list";
import { fail, ok } from "./demo-response";

export const demoStates = {
  async list(filter: StateFilter): Promise<StateListResponse> {
    const rows = [...getDb().states].sort((a, b) => a.name.localeCompare(b.name));
    return ok("Records loaded", listQuery(rows, { limit: 100, ...filter }, { searchFields: ["name"], exactFields: ["status"] }));
  },

  async details(id: number | string): Promise<StateDetailResponse> {
    const row = getDb().states.find((r) => String(r.id) === String(id));
    if (!row) return fail("Record not found.", 404);
    return ok("Record loaded", { data: row });
  },
};
