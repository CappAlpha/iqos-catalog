import type { SortKey } from "./types";

export const ROOT = "root" as const;
export const UNCAT_ID = "uncategorized" as const;
export const UNCAT_TITLE = "Без категории" as const;

export const CATALOG_DEFAULT = {
  cat: "",
  sort: "nameAsc" as SortKey,
  page: 1,
  pageSize: 12
};