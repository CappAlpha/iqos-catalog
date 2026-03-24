import { CATALOG_DEFAULT, SORT_OPTIONS } from "../model/constants";
import type { SortKey } from "../model/types";

function isSortKey(key: SortKey) {
  return SORT_OPTIONS.map(({ id }) => id).includes(key);
}

export function normalizeSort(v: SortKey | null) {
  if (v && isSortKey(v)) return v;
  return CATALOG_DEFAULT.sort;
}

export function normalizePage(v: string | null) {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) && n >= 1 ? n : CATALOG_DEFAULT.page;
}
