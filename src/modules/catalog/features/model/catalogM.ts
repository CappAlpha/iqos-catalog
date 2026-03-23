import { flow, makeAutoObservable, runInAction } from "mobx";

import { clamp } from "@/shared/lib/math";

import { fetchCatalog } from "../api/fetchCatalog";
import { getComparator } from "../lib/store";
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
      for (const child of this.categories) {
        if (child.parentId === rootId && !out.has(child.id)) {
          getChildIds(child.id, out);
        }
      }
      return out;
    };

    for (const [key, keywords] of Object.entries(GROUP_KEYWORDS) as [
      FilterGroupKey,
      string[],
    ][]) {
      const root = this.categories.find((cat) =>
        keywords.some((kw) => cat.title.includes(kw)),
      );
      map.set(key, root ? getChildIds(root.id) : new Set());
    }

    return map;
  }

  get categoryFilters(): FilterGroup[] {
    const counts = new Map<string, number>();
    const childToParentId = new Map<string, string>();

    for (const cat of this.groupedCategories) {
      for (const id of cat.ids) {
        childToParentId.set(id, cat.id);
      }
    }

    for (const product of this.products) {
      const catId = product.categoryId ?? UNCAT_ID;
      const groupId = childToParentId.get(catId);

      if (groupId) {
        counts.set(groupId, (counts.get(groupId) ?? 0) + 1);
      }
    }

    const groupIdsMap = this.groupIdsMap;
    const keys = Object.keys(GROUP_KEYWORDS) as FilterGroupKey[];

    return keys.map((key) => {
      const groupIds = groupIdsMap.get(key) ?? new Set();

      const categories = this.groupedCategories
        .filter((cat) => cat.ids.some((id) => groupIds.has(id)))
        .map((cat) => ({
          id: cat.id,
          title: cat.title,
          count: counts.get(cat.id) ?? 0,
        }))
        .filter((cat) => cat.count > 0);

      return { key, title: GROUP_TITLES[key], categories };
    });
  }

  get baseProductGroups(): ProductGroup[] {
    const map = new Map<string, Omit<ProductGroup, "id">>();

    for (const product of this.products) {
      const { groupId, baseName, type, variantLabel } =
        this.parseProductData(product);

      if (!map.has(groupId)) {
        map.set(groupId, { baseName, type, variants: [] });
      }
      map.get(groupId)?.variants.push({ ...product, variantLabel });
    }

    return Array.from(map.values()).map((group) => {
      if (group.type === "size") {
        group.variants.sort((a, b) => (a.price || 0) - (b.price || 0));
      }

      const safeVariants = group.variants.map((v, i, arr) => {
        const hasDuplicate = arr.some((x) => x !== v && x.id === v.id);
        return {
          ...v,
          originalId: v.id,
          id: hasDuplicate ? `${v.id}_var${i}` : v.id,
        };
      });

      return {
        id: safeVariants[0].id,
        baseName: group.baseName,
        type: group.type,
        variants: safeVariants,
      };
    });
  }

  private parseProductData(product: Product) {
    const nameLower = product.name.toLowerCase();
    const isSize = nameLower.includes("стик") || nameLower.includes("картридж");

    if (isSize) {
      return {
        type: "size" as const,
        groupId: product.id,
        variantLabel: nameLower.includes("блок") ? "Блок" : "Пачка",
        baseName: product.name.replace(/,?\s*(пачка|блок.*)/i, "").trim(),
      };
    }

    const commaIdx = product.name.lastIndexOf(",");
    const baseName =
      commaIdx !== -1
        ? product.name.substring(0, commaIdx).trim()
        : product.name;
    const variantLabel =
      commaIdx !== -1
        ? product.name.substring(commaIdx + 1).trim()
        : "Стандарт";

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
    return this.filteredProductGroups.slice().sort((a, b) => {
      return getComparator(this.sort)(a.variants[0], b.variants[0]);
    });
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
