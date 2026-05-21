import { CATALOG_DEFAULT, SORT_OPTIONS } from "../model/constants";
import type { SortKey } from "../model/types";

export const normalizeSort = (v: string | null): SortKey => {
  if (v && SORT_OPTIONS.some((opt) => opt.id === v)) return v as SortKey;
  return CATALOG_DEFAULT.sort;
};

export const normalizePage = (v: string | null) => {
  const n = Number.parseInt(v ?? "", 10);
  return n >= 1 ? n : CATALOG_DEFAULT.page;
};

export const getCleanCatsParam = (
  catsStr: string | null | undefined,
): string | null => {
  if (!catsStr) return null;

  const clean = catsStr
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .join(",");

  return clean || null;
};
