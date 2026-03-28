import { CATALOG_DEFAULT, SORT_OPTIONS } from "../model/constants";
import type { SortKey } from "../model/types";

export function normalizeSort(v: string | null): SortKey {
  if (v && SORT_OPTIONS.some((opt) => opt.id === v)) return v as SortKey;
  return CATALOG_DEFAULT.sort;
}

export function normalizePage(v: string | null) {
  const n = Number.parseInt(v ?? "", 10);
  return n >= 1 ? n : CATALOG_DEFAULT.page;
}
