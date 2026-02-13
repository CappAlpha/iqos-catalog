import type { PaginationItem } from "../model/types";

export const buildPagination = (current: number, total: number): PaginationItem[] => {
  if (total <= 1) return [];
  if (total <= 7) return Array.from({ length: total }, (_, i) => ({ type: "page", value: i + 1 }));

  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);

  const items: PaginationItem[] = [{ type: "page", value: 1 }];

  if (left > 2) items.push({ type: "dots", side: "left" });

  for (let p = left; p <= right; p++) items.push({ type: "page", value: p });

  if (right < total - 1) items.push({ type: "dots", side: "right" });

  items.push({ type: "page", value: total });

  return items;
}
