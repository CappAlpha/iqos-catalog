import { CATALOG_DEFAULT } from "../model/constants";
import type { SortKey } from "../model/types";

export function normalizeSort(v: string | null): SortKey {
  if (v === "nameAsc" || v === "nameDesc" || v === "priceAsc" || v === "priceDesc") return v;
  return CATALOG_DEFAULT.sort;
}

export function normalizePage(v: string | null): number {
  const n = Number.parseInt(v ?? "", 10);
  if (!Number.isFinite(n) || n < 1) return CATALOG_DEFAULT.page;
  return n;
}

export function setOrDelete(params: URLSearchParams, key: string, value: string, defaultValue: string) {
  if (!value || value === defaultValue) params.delete(key);
  else params.set(key, value);
}
