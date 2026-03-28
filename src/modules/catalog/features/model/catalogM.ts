import { flow, makeAutoObservable, runInAction } from "mobx";

import { clamp } from "@/shared/lib/math";

import { fetchCatalog } from "../api/fetchCatalog";
import { getComparator } from "../lib/comparators";
import {
  CATALOG_DEFAULT,
  UNCAT_ID,
  GROUP_KEYWORDS,
  GROUP_TITLES,
} from "./constants";
import type {
  Category,
  FilterGroup,
  FilterGroupKey,
  MergedCategory,
  Product,
  ProductGroup,
  SortKey,
  Status,
} from "./types";

class CatalogM {
  status: Status = "loading";
  error: string | null = null;

  categories: Category[] = [];
  products: Product[] = [];

  selectedCategoryId: string | null = null;
  sort: SortKey = CATALOG_DEFAULT.sort;
  page = CATALOG_DEFAULT.page;
  pageSize = CATALOG_DEFAULT.pageSize;

  isTransitioning = false;
  #transitionTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get groupedCategories(): MergedCategory[] {
    const map = new Map<string, MergedCategory>();

    for (const cat of this.categories) {
      const key = cat.title.trim().toLowerCase();
      const existing = map.get(key);

      if (existing) {
        existing.ids.push(cat.id);
      } else {
        map.set(key, { ...cat, ids: [cat.id] });
      }
    }

    return Array.from(map.values());
  }

  get groupIdsMap(): Map<FilterGroupKey, Set<string>> {
    const map = new Map<FilterGroupKey, Set<string>>();

    const getChildIds = (rootId: string, out = new Set<string>()) => {
      out.add(rootId);
      this.categories.forEach((child) => {
        if (child.parentId === rootId && !out.has(child.id))
          getChildIds(child.id, out);
      });
      return out;
    };

    (Object.entries(GROUP_KEYWORDS) as [FilterGroupKey, string[]][]).forEach(
      ([key, keywords]) => {
        const root = this.categories.find((cat) =>
          keywords.some((keyword) => cat.title.includes(keyword)),
        );
        map.set(key, root ? getChildIds(root.id) : new Set());
      },
    );
    return map;
  }

  get categoryFilters(): FilterGroup[] {
    const counts = new Map<string, number>();
    const childToParentId = new Map<string, string>();

    this.groupedCategories.forEach((cat) =>
      cat.ids.forEach((id) => childToParentId.set(id, cat.id)),
    );

    this.products.forEach((product) => {
      const groupId = childToParentId.get(product.categoryId ?? UNCAT_ID);
      if (groupId) counts.set(groupId, (counts.get(groupId) ?? 0) + 1);
    });

    return (Object.keys(GROUP_KEYWORDS) as FilterGroupKey[]).map((key) => {
      const groupIds = this.groupIdsMap.get(key);

      return {
        key,
        title: GROUP_TITLES[key],
        categories: this.groupedCategories
          .filter((cat) => cat.ids.some((id) => groupIds?.has(id)))
          .map((cat) => ({
            id: cat.id,
            title: cat.title,
            count: counts.get(cat.id) ?? 0,
          }))
          .filter((cat) => cat.count > 0),
      };
    });
  }

  get baseProductGroups(): ProductGroup[] {
    const groups = new Map<string, Omit<ProductGroup, "id">>();

    this.products.forEach((product) => {
      const { groupId, baseName, type, variantLabel } =
        this.parseProductData(product);
      if (!groups.has(groupId))
        groups.set(groupId, { baseName, type, variants: [] });
      groups.get(groupId)!.variants.push({ ...product, variantLabel });
    });

    return Array.from(groups.values()).map((group) => {
      if (group.type === "size") {
        group.variants.sort((a, b) => (a.price || 0) - (b.price || 0));
      }

      const variants = group.variants.map((v, i) => ({
        ...v,
        originalId: v.id,
        id: `${v.id}_${i}`,
      }));

      return {
        id: variants[0].originalId,
        baseName: group.baseName,
        type: group.type,
        variants,
      };
    });
  }

  private parseProductData(product: Product) {
    const lowerName = product.name.toLowerCase();
    const isSizeVariant =
      lowerName.includes("стик") || lowerName.includes("картридж");

    if (isSizeVariant) {
      return {
        type: "size" as const,
        groupId: product.id,
        variantLabel: lowerName.includes("блок") ? "Блок" : "Пачка",
        baseName: product.name.replace(/,?\s*(пачка|блок.*)/i, "").trim(),
      };
    }

    const [baseName, variantLabel = "Стандарт"] = product.name.split(/\s*,\s*/);

    return {
      type: "color" as const,
      groupId: baseName,
      variantLabel,
      baseName,
    };
  }

  get filteredProductGroups(): ProductGroup[] {
    if (!this.selectedCategoryId) return this.baseProductGroups;

    const group = this.groupedCategories.find(
      (c) => c.id === this.selectedCategoryId,
    );
    if (!group) return this.baseProductGroups;

    const groupIds = new Set(group.ids);
    return this.baseProductGroups.filter((g) =>
      g.variants.some((v) => groupIds.has(v.categoryId ?? UNCAT_ID)),
    );
  }

  get sortedProductGroups(): ProductGroup[] {
    const compare = getComparator(this.sort);

    return [...this.filteredProductGroups].sort((a, b) =>
      compare(a.variants[0], b.variants[0]),
    );
  }

  get pagedProductGroups(): ProductGroup[] {
    const start = (this.safePage - 1) * this.pageSize;
    return this.sortedProductGroups.slice(start, start + this.pageSize);
  }

  get totalCount() {
    return this.filteredProductGroups.length;
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  get safePage() {
    return clamp(this.page, 1, this.totalPages);
  }

  get showSkeleton() {
    return this.status === "loading" || this.isTransitioning;
  }

  get isLoading() {
    return this.status === "loading";
  }

  get isEmpty() {
    return (
      this.status === "success" && !this.showSkeleton && this.totalCount === 0
    );
  }

  get isAnyFilterSelected() {
    return this.selectedCategoryId !== null;
  }

  get skeletonCount() {
    return this.totalCount > 0 ? this.pagedProductGroups.length : this.pageSize;
  }

  private triggerTransition(ms = 400) {
    this.isTransitioning = true;
    if (this.#transitionTimer) clearTimeout(this.#transitionTimer);

    this.#transitionTimer = setTimeout(() => {
      runInAction(() => {
        this.isTransitioning = false;
        this.#transitionTimer = null;
      });
    }, ms);
  }

  private updateWithTransition(updateFn: () => void) {
    this.triggerTransition();
    updateFn();
  }

  setSort(key: SortKey) {
    if (this.sort === key) return;
    this.updateWithTransition(() => {
      this.sort = key;
      this.page = CATALOG_DEFAULT.page;
    });
  }

  setCategory(id: string | null) {
    if (this.selectedCategoryId === id) return;
    this.updateWithTransition(() => {
      this.selectedCategoryId = id;
      this.page = CATALOG_DEFAULT.page;
    });
  }

  toggleCategory(id: string | null) {
    this.setCategory(this.selectedCategoryId === id ? null : id);
  }

  setPage(n: number) {
    this.triggerTransition();
    this.page = n;
  }

  resetFilters() {
    this.updateWithTransition(() => {
      this.selectedCategoryId = null;
      this.sort = CATALOG_DEFAULT.sort;
      this.page = CATALOG_DEFAULT.page;
    });
  }

  fetchData = flow(function* (this: CatalogM) {
    if (this.#transitionTimer) clearTimeout(this.#transitionTimer);
    this.isTransitioning = false;

    this.status = "loading";
    this.error = null;
    this.categories = [];
    this.products = [];

    try {
      const data: Awaited<ReturnType<typeof fetchCatalog>> =
        yield fetchCatalog();
      this.categories = data.categories;
      this.products = data.products;
      this.page = this.safePage;

      this.status = "success";
    } catch (e) {
      this.status = "error";
      this.error = e instanceof Error ? e.message : "Ошибка загрузки";
    }
  });
}

export const catalogM = new CatalogM();
