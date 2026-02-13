export type Status = "idle" | "loading" | "success" | "error";

export type SortKey = "nameAsc" | "nameDesc" | "priceAsc" | "priceDesc";

export type Category = {
  id: string;
  title: string;
  parentId: string | null;
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

export type SelectOption = { id: string; label: string };

export type FeedResult = {
  categories: Category[];
  products: Product[];
};

export type PaginationItem =
  | { type: "page"; value: number }
  | { type: "dots"; side: "left" | "right" };