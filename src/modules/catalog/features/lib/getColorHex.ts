import { COLOR_MAP } from "../model/constants";

export const getColorHex = (label: string) =>
  COLOR_MAP[label.toLowerCase()] || "#CCC";
