import { flow, makeAutoObservable, runInAction } from "mobx";
import { clamp } from "../../../../shared/lib/math";
import { fetchCatalog } from "../api/fetchCatalog";
import { CATALOG_DEFAULT, UNCAT_ID, GROUP_KEYWORDS, GROUP_TITLES } from "./constants";
import type { Category, FilterGroup, FilterGroupKey, MergedCategory, Product, SortKey, Status } from "./types";
import { getComparator } from "../lib/store";

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

  get mergedCategoriesById(): Map<string, MergedCategory> {
    const map = new Map<string, MergedCategory>();
    for (const cat of this.mergedCategories) {
      map.set(cat.id, cat);
    }
    return map;
  }

  get categoryCounts(): Map<string, number> {
    const counts = new Map<string, number>();
    const childToParentId = new Map<string, string>();

    for (const cat of this.mergedCategories) {
      counts.set(cat.id, 0);
      for (const id of cat.ids) {
        childToParentId.set(id, cat.id);
      }
    }

    for (const product of this.products) {
      const catId = product.categoryId ?? UNCAT_ID;
      const groupId = childToParentId.get(catId);

      if (groupId && counts.has(groupId)) {
        counts.set(groupId, counts.get(groupId)! + 1);
      }
    }

    return counts;
  }

  get groupIdsMap(): Map<FilterGroupKey, Set<string>> {
    const map = new Map<FilterGroupKey, Set<string>>();
    const keys = Object.keys(GROUP_KEYWORDS) as FilterGroupKey[];

    for (const key of keys) {
      const keywords = GROUP_KEYWORDS[key];
      const root = this.categories.find(cat =>
        keywords.some(keyword => cat.title.includes(keyword))
      );

      const ids = new Set<string>();
      if (root) {
        this.collectAllChildIds(root.id, ids);
      }
      map.set(key, ids);
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
        .filter(cat => cat.ids.some(id => groupIds.has(id)))
        .map(cat => ({
          id: cat.id,
          title: cat.title,
          count: counts.get(cat.id) ?? 0,
        }))
        .filter(cat => cat.count > 0);

      return { key, title: GROUP_TITLES[key], categories };
    });
  }

  get filteredProducts(): Product[] {
    if (!this.selectedCategoryId) return this.products;

    const group = this.mergedCategoriesById.get(this.selectedCategoryId);
    if (!group) return this.products;

    const groupIds = new Set(group.ids);
    return this.products.filter(p => groupIds.has(p.categoryId ?? UNCAT_ID));
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
    return this.status === "loading" || this.status === "idle" || this.isTransitioning;
  }

  get isLoading() {
    return this.status === "loading";
  }

  get isEmpty() {
    return this.status === "success" && !this.showSkeleton && this.products.length === 0;
  }

  get skeletonCount() {
    return this.totalCount > 0 ? this.viewProducts.length : this.pageSize;
  }

  private collectAllChildIds(rootId: string, collected: Set<string>): void {
    collected.add(rootId);
    for (const child of this.categories) {
      if (child.parentId === rootId) {
        this.collectAllChildIds(child.id, collected);
      }
    }
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
    this.page = CATALOG_DEFAULT.page;
  }

  setSort(key: SortKey) {
    if (this.sort === key) return;
    this.updateWithTransition(() => {
      this.sort = key;
    });
  }

  setCategory(id: string | null) {
    if (this.selectedCategoryId === id) return;
    this.updateWithTransition(() => {
      this.selectedCategoryId = id;
    });
  }

  toggleCategory(id: string | null) {
    this.updateWithTransition(() => {
      this.selectedCategoryId = this.selectedCategoryId === id ? null : id;
    });
  }

  setPage(n: number) {
    this.triggerTransition();
    this.page = n;
  }

  setPageSize(size: number) {
    if (this.pageSize === size) return;
    this.updateWithTransition(() => {
      this.pageSize = size;
    });
  }

  resetFilters() {
    this.updateWithTransition(() => {
      this.selectedCategoryId = null;
      this.sort = CATALOG_DEFAULT.sort;
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
      this.page = clamp(this.page, 1, Math.max(1, Math.ceil(this.totalCount / this.pageSize)));

      this.status = "success";
    } catch (e) {
      this.status = "error";
      this.error = e instanceof Error ? e.message : "Ошибка загрузки";
    }
  });
}

export const catalogStore = new CatalogStore();