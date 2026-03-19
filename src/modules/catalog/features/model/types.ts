export type Status = "loading" | "success" | "error";

export type SortKey = "nameAsc" | "nameDesc" | "priceAsc" | "priceDesc";

export type FilterGroupKey = "devices" | "sticks" | "accessories";

export interface FilterGroup {
  key: FilterGroupKey;
  title: string;
  categories: Array<{
    id: string;
    title: string;
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

export interface ProductGroup {
  id: string;
  baseName: string;
  type: "size" | "color";
  variants: (Product & { variantLabel: string })[];
}

export type FeedResult = {
  categories: Category[];
  products: Product[];
};

export type PaginationItem =
  | { type: "page"; value: number }
  | { type: "dots"; side: "left" | "right" };
