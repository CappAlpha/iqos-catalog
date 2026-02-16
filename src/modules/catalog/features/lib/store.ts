import type { SortKey, Product } from "../model/types";

const collator = new Intl.Collator("ru", { sensitivity: "base", numeric: true });
const compareText = (a: string, b: string) => collator.compare(a, b);
const compareNumbers = (a: number | null, b: number | null) => {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
};

const COMPARATORS: Record<SortKey, (a: Product, b: Product) => number> = {
  nameAsc: (a, b) => compareText(a.name, b.name),
  nameDesc: (a, b) => compareText(b.name, a.name),
  priceAsc: (a, b) => compareNumbers(a.price, b.price) || compareText(a.name, b.name),
  priceDesc: (a, b) => -compareNumbers(a.price, b.price) || compareText(a.name, b.name),
};

export const getComparator = (key: SortKey) => {
  return COMPARATORS[key] ?? (() => 0);
};