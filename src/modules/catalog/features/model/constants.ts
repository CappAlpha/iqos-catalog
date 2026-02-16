import type { SortKey } from "./types";

export const feedUrl = "/mindbox_feed.xml";
// export const feedUrl = "https://www.iqos.ru/mindbox_feed.xml";

export const ROOT = "root" as const;
export const UNCAT_ID = "uncategorized" as const;
export const UNCAT_TITLE = "Без категории" as const;

export const CATALOG_DEFAULT = {
  cat: "",
  sort: "nameAsc" as SortKey,
  page: 1,
  pageSize: 12
};

export const sortOptions = [
  { id: "nameAsc", label: "Название (A→Я)" },
  { id: "nameDesc", label: "Название (Я→A)" },
  { id: "priceAsc", label: "Цена (↑)" },
  { id: "priceDesc", label: "Цена (↓)" },
];