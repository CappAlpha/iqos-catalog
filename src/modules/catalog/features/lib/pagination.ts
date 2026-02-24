import type { PaginationItem } from "../model/types";

const range = (start: number, end: number) => {
  const length = end - start + 1;
  return Array.from({ length }, (_, i) => start + i);
};

const toPage = (value: number) => ({ type: "page" as const, value });
const toDots = (side: "left" | "right") => ({ type: "dots" as const, side });

export const buildPagination = (
  current: number,
  total: number,
): PaginationItem[] => {
  if (total <= 1) return [];

  if (total <= 7) {
    return range(1, total).map((page) => toPage(page));
  }

  const left = Math.max(current - 1, 2);
  const right = Math.min(current + 1, total - 1);

  const hasLeftDots = left > 2;
  const hasRightDots = right < total - 1;

  const items: PaginationItem[] = [
    toPage(1),
    ...(hasLeftDots ? [toDots("left")] : []),
    ...range(left, right).map(toPage),
    ...(hasRightDots ? [toDots("right")] : []),
    toPage(total),
  ];

  return items;
};
