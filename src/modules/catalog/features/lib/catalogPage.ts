import { CATALOG_DEFAULT, SORT_OPTIONS } from "../model/constants";
import type { SortKey } from "../model/types";

function isSortKey(key: string): key is SortKey {
  return SORT_OPTIONS.map(({ id }) => id).includes(key);
}

export function normalizeSort(v: string | null): SortKey {
  if (v && isSortKey(v)) return v;
  return CATALOG_DEFAULT.sort;
}

export function normalizePage(v: string | null): number {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) && n >= 1 ? n : CATALOG_DEFAULT.page;
}

export function syncUrlParam(params: URLSearchParams, key: string, value: string | null, defaultValue?: string) {
  if (!value || value === defaultValue) {
    params.delete(key);
  } else {
    params.set(key, value);
  }
}