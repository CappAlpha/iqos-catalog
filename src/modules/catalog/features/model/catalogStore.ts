import { flow, makeAutoObservable, runInAction } from "mobx";

import { clamp } from "../../../../shared/lib/math";
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
  SortKey,
  Status,
} from "./types";

class CatalogStore {
  status: Status = "idle";
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

  get mergedCategories(): MergedCategory[] {
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

  get categoryCounts(): Map<string, number> {
    const counts = new Map<string, number>();
    const childToParentId = new Map<string, string>();

    for (const cat of this.mergedCategories) {
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

    return counts;
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

    for (const [key, keywords] of Object.entries(GROUP_KEYWORDS) as [FilterGroupKey, string[]][]) {
      const root = this.categories.find((cat) =>
        keywords.some((kw) => cat.title.includes(kw))
      );
      map.set(key, root ? getChildIds(root.id) : new Set());
    }

    return map;
  }

  get filterGroups(): FilterGroup[] {
    const counts = this.categoryCounts;
    const groupIdsMap = this.groupIdsMap;

    const keys = Object.keys(GROUP_KEYWORDS) as FilterGroupKey[];

    return keys.map((key) => {
      const groupIds = groupIdsMap.get(key) ?? new Set();

      const categories = this.mergedCategories
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

  get filteredProducts(): Product[] {
    if (!this.selectedCategoryId) return this.products;

    const group = this.mergedCategories.find((c) => c.id === this.selectedCategoryId);
    if (!group) return this.products;

    const groupIds = new Set(group.ids);
    return this.products.filter((p) => groupIds.has(p.categoryId ?? UNCAT_ID));
  }

  get sortedProducts(): Product[] {
    return this.filteredProducts.slice().sort(getComparator(this.sort));
  }

  get totalCount() {
    return this.filteredProducts.length;
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  get safePage() {
    return clamp(this.page, 1, this.totalPages);
  }

  get viewProducts(): Product[] {
    const start = (this.safePage - 1) * this.pageSize;
    return this.sortedProducts.slice(start, start + this.pageSize);
  }

  get showSkeleton() {
    return (
      this.status === "loading" ||
      this.status === "idle" ||
      this.isTransitioning
    );
  }

  get isLoading() {
    return this.status === "loading";
  }

  get isEmpty() {
    return (
      this.status === "success" &&
      !this.showSkeleton &&
      this.products.length === 0
    );
  }

  get skeletonCount() {
    return this.totalCount > 0 ? this.viewProducts.length : this.pageSize;
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
    this.updateWithTransition(() => {
      this.selectedCategoryId = this.selectedCategoryId === id ? null : id;
      this.page = CATALOG_DEFAULT.page;
    });
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

  fetchData = flow(function* (this: CatalogStore) {
    if (this.#transitionTimer) clearTimeout(this.#transitionTimer);
    this.isTransitioning = false;

    this.status = "loading";
    this.error = null;
    this.categories = [];
    this.products = [];

    try {
      const data = yield fetchCatalog();
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

export const catalogStore = new CatalogStore();
