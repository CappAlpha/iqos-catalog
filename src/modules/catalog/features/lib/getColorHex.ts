import { COLOR_MAP } from "../model/constants";

const FALLBACK_PATTERNS = [
  { pattern: "черн", color: "#1A1A1A" },
  { pattern: "бел", color: "#FFFFFF" },
  { pattern: "красн", color: "#E32636" },
  { pattern: "зелен", color: "#228B22" },
  { pattern: "син", color: "#0000FF" },
  { pattern: "желт", color: "#FFDF00" },
  { pattern: "золот", color: "#FFD700" },
  { pattern: "розов", color: "#FFB6C1" },
  { pattern: "оранж", color: "#FFA500" },
  { pattern: "сер", color: "#808080" },
  { pattern: "коричн", color: "#8B7355" },
  { pattern: "голуб", color: "#87CEFA" },
  { pattern: "фиолет", color: "#800080" },
  { pattern: "лилов", color: "#C8A2C8" },
  { pattern: "бирюз", color: "#40E0D0" },
  { pattern: "мятн", color: "#98FF98" },
  { pattern: "black", color: "#1A1A1A" },
  { pattern: "white", color: "#FFFFFF" },
  { pattern: "red", color: "#E32636" },
  { pattern: "green", color: "#228B22" },
  { pattern: "blue", color: "#0000FF" },
  { pattern: "yellow", color: "#FFDF00" },
  { pattern: "gold", color: "#FFD700" },
  { pattern: "pink", color: "#FFB6C1" },
  { pattern: "orange", color: "#FFA500" },
  { pattern: "grey", color: "#808080" },
  { pattern: "gray", color: "#808080" },
  { pattern: "brown", color: "#8B7355" },
  { pattern: "purple", color: "#800080" },
  { pattern: "violet", color: "#800080" },
  { pattern: "silver", color: "#C0C0C0" },
  { pattern: "bronze", color: "#CD7F32" },
  { pattern: "copper", color: "#B87333" },
];

const normalizeLabel = (label: string): string => {
  return label.toLowerCase().trim().replaceAll("ё", "е");
};

export const getColorHex = (label: string): string => {
  if (!label) return "#CCC";

  const normalized = normalizeLabel(label);

  if (COLOR_MAP[normalized]) {
    return COLOR_MAP[normalized];
  }

  for (const { pattern, color } of FALLBACK_PATTERNS) {
    if (normalized.includes(pattern)) {
      return color;
    }
  }

  return "#CCC";
};
