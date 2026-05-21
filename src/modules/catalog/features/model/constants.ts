import type { FilterGroupKey, SortKey } from "./types";

export const RESERVE_FEED_URL = "mindbox_feed.xml";
export const FEED_URL = "https://www.iqos.ru/mindbox_feed.xml";

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
  // Нейтральные (Белые, Черные, Серые)
  черный: "#1A1A1A",
  белый: "#FFFFFF",
  "белый жемчуг": "#FDFDFD",
  "белый хром": "#E8E8E8",
  серый: "#808080",
  графитовый: "#4A4A4A",
  "угольно-серый": "#36454F",
  "черный титан": "#2C2C2C",
  "черный агат": "#1F1F1F",
  "космический черный": "#202020",

  // Красные, Розовые, Фиолетовые
  красный: "#E32636",
  алый: "#FF2400",
  "красный матовый": "#C32148",
  "красная терракота": "#CC4E4C",
  "гранатовый красный": "#F44336",
  розовый: "#FFB6C1",
  пудровый: "#FFDAB9",
  фуксия: "#FF00FF",
  "сияющий рубин": "#E0115F",
  ультрафиолет: "#5D3FD3",
  лиловый: "#C8A2C8",
  сливовый: "#DDA0DD",
  бордовый: "#800000",

  // Синие, Голубые, Бирюзовые
  синий: "#0000FF",
  голубой: "#87CEFA",
  "темно-синий": "#000080",
  "синий металлик": "#318CE7",
  "синий сапфир": "#0F52BA",
  "стальной синий": "#4682B4",
  "галактический синий": "#1D2951",
  черничный: "#4F86F7",
  бирюзовый: "#40E0D0",
  аквамарин: "#7FFFD4",

  // Зеленые
  зеленый: "#228B22",
  "темно-зеленый": "#006400",
  "зеленый кобальт": "#20B2AA",
  "полярный зеленый": "#00A86B",
  "бирюзово-зеленый": "#00A86B",
  оливковый: "#808000",
  изумрудный: "#50C878",
  мятный: "#98FF98",
  лаймовый: "#32CD32",
  "сияющий александрит": "#5C8C85",

  // Желтые, Оранжевые, Коричневые
  "желтый матовый": "#FFD700",
  золотой: "#FFD700",
  "золотисто-желтый": "#FFDF00",
  "сияющий топаз": "#FFC87C",
  лимонный: "#FFFACD",
  горчичный: "#FFDB58",
  оранжевый: "#FFA500",
  "яркий оранжевый": "#FF8C00",
  коралловый: "#FF7F50",
  бежевый: "#F5F5DC",
  бронзовый: "#CD7F32",
  "красная медь": "#B87333",
  "пепельно-коричневый": "#8B7355",
  "карамельно-коричневый": "#C68E17",
  серебряный: "#C0C0C0",

  // Градиенты
  "красочный микс": "linear-gradient(45deg, #FF6B6B, #4ECDC4, #FFE66D)",

  // Базовые английские названия цветов
  black: "#1A1A1A",
  white: "#FFFFFF",
  grey: "#808080",
  gray: "#808080",
  indigo: "#4B0082",
  gold: "#FFD700",
  blue: "#0000FF",
  red: "#E32636",
  green: "#228B22",
  silver: "#C0C0C0",
  bronze: "#CD7F32",
  copper: "#B87333",
  yellow: "#FFDF00",
  pink: "#FFB6C1",
  orange: "#FFA500",
  purple: "#800080",
  violet: "#800080",
  brown: "#8B7355",
};
