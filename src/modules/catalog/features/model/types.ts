export type TSortKey = "nameAsc" | "nameDesc" | "priceAsc" | "priceDesc";

export type TFilterGroupKey = "devices" | "sticks" | "accessories";

export interface IFilterGroup {
  key: TFilterGroupKey;
  title: string;
  categories: Array<{
    id: string;
    title: string;
  }>;
}

export type TCategory = {
  id: string;
  title: string;
  parentId: string | null;
};

export type TMergedCategory = TCategory & {
  ids: string[];
  isAll?: boolean;
};

export type TProduct = {
  id: string;
  originalId?: string;
  name: string;
  description: string | null;
  price: number;
  currencyId: string | null;
  categoryId: string | null;
  categoryTitle: string | null;
  pictureUrl: string | null;
  url: string | null;
  available: boolean;
};

export interface IProductGroup {
  id: string;
  baseName: string;
  type: "size" | "color";
  variants: (TProduct & { variantLabel: string })[];
}

export type TFeedResult = {
  categories: TCategory[];
  products: TProduct[];
};

export type TPaginationItem =
  { type: "page"; value: number } | { type: "dots"; side: "left" | "right" };
