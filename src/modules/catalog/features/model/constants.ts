import type { SortKey } from "./types";

export const DEFAULT_FEED_URL = "/mindbox_feed.xml";
// export const DEFAULT_FEED_URL = "https://www.iqos.ru/mindbox_feed.xml";

export const UNCAT_ID = "uncategorized" as const;
export const UNCAT_TITLE = "Без категории" as const;

export const CATALOG_DEFAULT = {
  sort: "nameAsc" as SortKey,
  page: 1,
  pageSize: 12
};

export const SORT_OPTIONS = [
  { id: "nameAsc", label: "Название (A→Я)" },
  { id: "nameDesc", label: "Название (Я→A)" },
  { id: "priceAsc", label: "Сначала дешевле" },
  { id: "priceDesc", label: "Сначала дороже" },
];

export const GROUP_KEYWORDS = {
  devices: ["Устройства"],
  sticks: ["Стики"],
  accessories: ["Аксессуары и комплектующие"],
};