import type { FilterGroupKey, SortKey } from "./types";

export const DEFAULT_FEED_URL = "mindbox_feed.xml";
// export const DEFAULT_FEED_URL = "https://www.iqos.ru/mindbox_feed.xml";

export const UNCAT_ID = "uncategorized" as const;
export const UNCAT_TITLE = "Без категории" as const;

export const CATALOG_DEFAULT = {
  sort: "nameAsc" as SortKey,
  page: 1,
  pageSize: 12,
};

export const SORT_OPTIONS: { id: SortKey; label: string }[] = [
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

export const GROUP_TITLES: Record<FilterGroupKey, string> = {
  devices: "Устройства",
  sticks: "Тип стиков",
  accessories: "Аксессуары и комплектующие",
};

export const SIZE_VARIANT_REGEX = /(стик|картридж)/i;
export const BLOCK_REGEX = /блок/i;
export const CLEAN_NAME_REGEX = /,?\s*(пачка|блок.*)/i;

export const COLOR_MAP: Record<string, string> = {
  "желтый матовый": "#FFD700",
  розовый: "#FFB6C1",
  "красный матовый": "#C32148",
  бирюзовый: "#40E0D0",
  "фиолетовый матовый": "#800080",
  черничный: "#4F86F7",
  аквамарин: "#7FFFD4",
  "красная терракота": "#CC4E4C",
  бронзовый: "#CD7F32",
  "белый жемчуг": "#FDFDFD",
  зеленый: "#228B22",
  морской: "#006994",
  "зеленый кобальт": "#20B2AA",
  бордовый: "#800000",
  "темно-синий": "#000080",
  "угольно-серый": "#36454F",
  "пепельно-коричневый": "#8B7355",
  "карамельно-коричневый": "#C68E17",
  "темно-зеленый": "#006400",
  "красная медь": "#B87333",
  "черный титан": "#2C2C2C",
  "чёрный титан": "#2C2C2C",
  "белый хром": "#E8E8E8",
  оливковый: "#808000",
  изумрудный: "#50C878",
  "синий металлик": "#318CE7",
  красный: "#E32636",
  черный: "#1A1A1A",
  black: "#1A1A1A",
  white: "#FFFFFF",
  grey: "#808080",
  indigo: "#4B0082",
  синий: "#0000FF",
  бежевый: "#F5F5DC",
  "синий сапфир": "#0F52BA",
  "черный агат": "#1F1F1F",
  графитовый: "#4A4A4A",
  "сияющий рубин": "#E0115F",
  "сияющий александрит": "#5C8C85",
  "сияющий топаз": "#FFC87C",
  "полярный зелёный": "#00A86B",
  "галактический синий": "#1D2951",
  "космический чёрный": "#202020",
  ультрафиолет: "#5D3FD3",
  "золотисто-желтый": "#FFDF00",
  лиловый: "#C8A2C8",
  алый: "#FF2400",
  голубой: "#87CEFA",
  "бирюзово-зеленый": "#00A86B",
  "гранатовый красный": "#F44336",
  "яркий оранжевый": "#FF8C00",
  оранжевый: "#FFA500",
  горчичный: "#FFDB58",
  золотой: "#FFD700",
  copper: "#B87333",
  серебряный: "#C0C0C0",
  пудровый: "#FFDAB9",
  коралловый: "#FF7F50",
  фуксия: "#FF00FF",
  лимонный: "#FFFACD",
  мятный: "#98FF98",
  сливовый: "#DDA0DD",
  "стальной синий": "#4682B4",
  лаймовый: "#32CD32",
  "красочный микс": "linear-gradient(45deg, #FF6B6B, #4ECDC4, #FFE66D)",
};
