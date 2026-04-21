import type { SortKey, Product } from "../model/types";

const collator = new Intl.Collator("ru", {
  sensitivity: "base",
  numeric: true,
});

const compareText = (a: string, b: string) => collator.compare(a, b);

const comparePrices = (
  a: number | null | undefined,
  b: number | null | undefined,
  isDesc = false,
) => {
  const aIsNull = a === null || a === undefined;
  const bIsNull = b === null || b === undefined;

  if (aIsNull && bIsNull) return 0;
  if (aIsNull) return 1;
  if (bIsNull) return -1;

  return isDesc ? b - a : a - b;
};

const COMPARATORS: Record<SortKey, (a: Product, b: Product) => number> = {
  nameAsc: (a, b) => compareText(a.name, b.name),
  nameDesc: (a, b) => compareText(b.name, a.name),

  priceAsc: (a, b) =>
    comparePrices(a.price, b.price) || compareText(a.name, b.name),
  priceDesc: (a, b) =>
    comparePrices(a.price, b.price, true) || compareText(a.name, b.name),
};

const defaultComparator = () => 0;

export const getComparator = (key: SortKey) =>
  COMPARATORS[key] ?? defaultComparator;
