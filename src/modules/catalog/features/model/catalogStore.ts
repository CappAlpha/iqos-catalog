import { flow, makeAutoObservable, runInAction } from "mobx";
import { clamp } from "../../../../shared/lib/math";
import { fetchCatalog } from "../api/fetchCatalog";
import { CATALOG_DEFAULT, UNCAT_ID } from "./constants";
import type { Category, MergedCategory, Product, SortKey, Status } from "./types";
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

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get mergedCategories(): MergedCategory[] {
    const map = new Map<string, MergedCategory>();

    this.categories.forEach((cat) => {
      const title = cat.title.trim();
      const existing = map.get(title);

      if (existing) {
        existing.ids.push(cat.id);
      } else {
        map.set(title, {
          ...cat,
          ids: [cat.id],
        });
      }
    });

    return Array.from(map.values());
  }

  get categoryWithCount() {
    const counts = new Map<string, number>();
    const byId = new Map<string, MergedCategory>();

    this.mergedCategories.forEach((c) => {
      byId.set(c.id, c);
      counts.set(c.id, 0);
    });

    for (const p of this.products) {
      const catId = p.categoryId ?? UNCAT_ID;

      for (const [groupId, group] of byId.entries()) {
        if (group.isAll) continue;
        if (group.ids.includes(catId)) {
          counts.set(groupId, (counts.get(groupId) ?? 0) + 1);
          break;
        }
      }
    }

    return { counts, byId };
  }

  get filteredProducts(): Product[] {
    if (!this.selectedCategoryId) {
      return this.products;
    }

    const group = this.categoryWithCount.byId.get(this.selectedCategoryId);
    if (!group) return this.products;

    return this.products.filter((p) => {
      const prodCatId = p.categoryId ?? UNCAT_ID;
      return group.ids.includes(prodCatId);
    });
  }

  get sortedProducts(): Product[] {
    return this.filteredProducts.slice().sort(getComparator(this.sort));
  }

  // Pagination
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
    if (this.selectedCategoryId === id) {
      this.selectedCategoryId = null;
    } else {
      this.selectedCategoryId = id;
      this.page = 1;
    }
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

  fetchData = flow(function* (this: CatalogStore) {
    if (this._transitionTimer) clearTimeout(this._transitionTimer);
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