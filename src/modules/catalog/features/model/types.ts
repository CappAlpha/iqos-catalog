export type Status = "idle" | "loading" | "success" | "error";

export type SortKey = "nameAsc" | "nameDesc" | "priceAsc" | "priceDesc";

export type FilterGroupKey = "devices" | "sticks" | "accessories";

export type SelectOption = { id: string; label: string };

export interface FilterGroup {
  key: FilterGroupKey;
  title: string;
  categories: Array<{
    id: string;
    title: string;
    count: number;
  }>;
}

export type Category = {
  id: string;
  title: string;
  parentId: string | null;
};

export type MergedCategory = Category & {
  ids: string[];
  isAll?: boolean;
};

export type Product = {
  id: string;
  name: string;
  price: number | null;
  currencyId: string | null;
  categoryId: string | null;
  categoryTitle: string | null;
  pictureUrl: string | null;
  url: string | null;
  available: boolean;
};

export type FeedResult = {
  categories: Category[];
  products: Product[];
};

export type PaginationItem =
  | { type: "page"; value: number }
  | { type: "dots"; side: "left" | "right" };