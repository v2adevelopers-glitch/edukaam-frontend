/*
 * DEMO ONLY. Applies search, exact filters, page and limit to an array and returns the one list
 * shape every list page uses: { data, pagination: { total, page, limit, totalPages } }.
 */
import type { Pagination } from "../types/common.types";

export interface ListOptions<T> {
  searchFields?: (keyof T)[]; // fields matched by the free-text `search` filter (case-insensitive)
  exactFields?: (keyof T)[]; // filter keys compared with === after String()
}

const isEmpty = (v: unknown) => v === undefined || v === null || v === "";

export const listQuery = <T extends object>(
  rows: T[],
  filter: Record<string, unknown> = {},
  options: ListOptions<T> = {},
): { data: T[]; pagination: Pagination } => {
  const { searchFields = [], exactFields = [] } = options;
  let result = rows;

  const search = String(filter.search ?? "").trim().toLowerCase();
  if (search) {
    result = result.filter((row) =>
      searchFields.some((field) => String(row[field] ?? "").toLowerCase().includes(search)),
    );
  }

  exactFields.forEach((field) => {
    const value = filter[field as string];
    if (!isEmpty(value)) {
      result = result.filter((row) => String(row[field] ?? "") === String(value));
    }
  });

  const total = result.length;
  const limit = Math.max(1, Number(filter.limit) || 10);
  const page = Math.max(1, Number(filter.page) || 1);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const data = result.slice((page - 1) * limit, page * limit);

  return { data, pagination: { total, page, limit, totalPages } };
};
