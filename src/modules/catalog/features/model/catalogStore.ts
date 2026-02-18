import { flow, makeAutoObservable, runInAction } from "mobx";
import { clamp } from "../../../../shared/lib/math";
import { fetchCatalog } from "../api/fetchCatalog";
import { CATALOG_DEFAULT, UNCAT_ID, GROUP_KEYWORDS } from "./constants";
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
  private _transitionTimer: ReturnType<typeof setTimeout> | null = null;

  private _groupIdsCache: Map<FilterGroupKey, Set<string>> | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get mergedCategories(): MergedCategory[] {
    const map = new Map<string, MergedCategory>();

    for (const cat of this.categories) {
      const title = cat.title.trim();
      const existing = map.get(title);

      if (existing) {
        existing.ids.push(cat.id);
      } else {
        map.set(title, { ...cat, ids: [cat.id] });
      }
    }

    return Array.from(map.values());
  }

  get categoryWithCount() {
    const counts = new Map<string, number>();
    const byId = new Map<string, MergedCategory>();

    const idToGroupId = new Map<string, string>();

    for (const cat of this.mergedCategories) {
      byId.set(cat.id, cat);
      counts.set(cat.id, 0);
      for (const id of cat.ids) {
        idToGroupId.set(id, cat.id);
      }
    }

    for (const product of this.products) {
      const catId = product.categoryId ?? UNCAT_ID;
      const groupId = idToGroupId.get(catId);

      if (groupId && counts.has(groupId)) {
        counts.set(groupId, counts.get(groupId)! + 1);
      }
    }

    return { counts, byId };
  }

  private getGroupIdsMap(): Map<FilterGroupKey, Set<string>> {
    if (this._groupIdsCache) return this._groupIdsCache;

    const map = new Map<FilterGroupKey, Set<string>>();
    const keys = Object.keys(GROUP_KEYWORDS) as FilterGroupKey[];

    for (const key of keys) {
      const root = this.findRootCategory(key);
      const ids = new Set<string>();

      if (root) {
        this.collectAllChildIds(root.id, ids);
      }

      map.set(key, ids);
    }

    this._groupIdsCache = map;
    return map;
  }

  private findRootCategory(key: FilterGroupKey): Category | null {
    const keywords = GROUP_KEYWORDS[key];
    return this.categories.find((cat) =>
      keywords.some((keyword) => cat.title.includes(keyword))
    ) ?? null;
  }

  private collectAllChildIds(rootId: string, collected: Set<string>): void {
    collected.add(rootId);

    for (const child of this.categories) {
      if (child.parentId === rootId) {
        this.collectAllChildIds(child.id, collected);
      }
    }
  }

  get filterGroups(): FilterGroup[] {
    const { counts } = this.categoryWithCount;
    const groupIdsMap = this.getGroupIdsMap();

    const buildGroup = (key: FilterGroupKey, title: string): FilterGroup => {
      const groupIds = groupIdsMap.get(key) ?? new Set();

      const categories = this.mergedCategories
        .filter((cat) => cat.ids.some((id) => groupIds.has(id)))
        .map((cat) => ({
          id: cat.id,
          title: cat.title,
          count: counts.get(cat.id) ?? 0,
        }))
        .filter((cat) => cat.count > 0);

      return { key, title, categories };
    };

    return [
      buildGroup("devices", "Устройства"),
      buildGroup("sticks", "Тип стиков"),
      buildGroup("accessories", "Аксессуары и комплектующие"),
    ];
  }

  get filteredProducts(): Product[] {
    if (!this.selectedCategoryId) return this.products;

    const group = this.categoryWithCount.byId.get(this.selectedCategoryId);
    if (!group) return this.products;

    const groupIds = new Set(group.ids);
    return this.products.filter((p) => {
      const prodCatId = p.categoryId ?? UNCAT_ID;
      return groupIds.has(prodCatId);
    });
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

  private uiLoading(ms = 400) {
    this.isTransitioning = true;
    if (this._transitionTimer) clearTimeout(this._transitionTimer);

    this._transitionTimer = setTimeout(() => {
      runInAction(() => {
        this.isTransitioning = false;
        this._transitionTimer = null;
      });
    }, ms);
  }

  setSort(key: SortKey) {
    if (this.sort === key) return;
    this.uiLoading();
    this.sort = key;
    this.page = 1;
  }

  setCategory(id: string | null) {
    if (this.selectedCategoryId === id) return;
    this.selectedCategoryId = id;
    this.page = 1;
  }

  toggleCategory(id: string | null) {
    this.uiLoading();
    this.selectedCategoryId = this.selectedCategoryId === id ? null : id;
    this.page = 1;
  }

  setPage(n: number) {
    this.uiLoading();
    this.page = n;
  }

  setPageSize(size: number) {
    if (this.pageSize === size) return;
    this.uiLoading();
    this.pageSize = size;
    this.page = 1;
  }

  resetFilters() {
    this.uiLoading();
    this.selectedCategoryId = null;
    this.sort = "nameAsc";
    this.page = 1;
  }

  fetchData = flow(function* (this: CatalogStore) {
    if (this._transitionTimer) clearTimeout(this._transitionTimer);
    this.isTransitioning = false;

    this.status = "loading";
    this.error = null;
    this.categories = [];
    this.products = [];
    this._groupIdsCache = null;

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