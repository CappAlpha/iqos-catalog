import type { PaginationItem } from "../model/types";

const range = (start: number, end: number) => {
  const length = end - start + 1;
  return Array.from({ length }, (_, i) => start + i);
};

const toPage = (value: number): PaginationItem => ({ type: "page", value });
const toDots = (side: "left" | "right"): PaginationItem => ({
  type: "dots",
  side,
});

export const buildPagination = (
  current: number,
  total: number,
): PaginationItem[] => {
  if (total <= 1) return [];

  if (total <= 7) return range(1, total).map(toPage);

  const siblings = 1;
  const showLeftDots = current > 2 + siblings;
  const showRightDots = current < total - (1 + siblings);

  if (!showLeftDots && showRightDots) {
    const leftItemCount = 3 + 2 * siblings;
    return [
      ...range(1, leftItemCount).map(toPage),
      toDots("right"),
      toPage(total),
    ];
  }

  if (showLeftDots && !showRightDots) {
    const rightItemCount = 3 + 2 * siblings;
    return [
      toPage(1),
      toDots("left"),
      ...range(total - rightItemCount + 1, total).map(toPage),
    ];
  }

  if (showLeftDots && showRightDots) {
    return [
      toPage(1),
      toDots("left"),
      ...range(current - siblings, current + siblings).map(toPage),
      toDots("right"),
      toPage(total),
    ];
  }

  return [];
};
