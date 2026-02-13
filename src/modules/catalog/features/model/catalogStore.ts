import { flow, makeAutoObservable, runInAction } from "mobx";
import { clamp } from "../../../../shared/lib/math";
import { fetchCatalog } from "../api/fetchCatalog";
import { CATALOG_DEFAULT, UNCAT_ID } from "./constants";
import type { Category, Product, SortKey, Status } from "./types";
import { compareText, cmpNumNullLastAsc } from "../lib/store";

class CatalogStore {
  status: Status = "idle";
  error: string | null = null;

  categories: Category[] = [];
  products: Product[] = [];

  selectedCategoryId = "";
  sort: SortKey = CATALOG_DEFAULT.sort;

  page = CATALOG_DEFAULT.page;
  pageSize = CATALOG_DEFAULT.pageSize;

  uiLoading = false;
  private uiTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get isLoading() {
    return this.status === "loading";
  }
  get isError() {
    return this.status === "error";
  }
  get isInitial() {
    return this.status === "idle" && this.products.length === 0;
  }

  get categoryMeta() {
    const byId = new Map<string, Category>();
    for (const c of this.categories) byId.set(c.id, c);

    const counts = new Map<string, number>();
    for (const p of this.products) {
      if (p.categoryId == null) continue;
      counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1);
    }

    if (counts.has(UNCAT_ID) && !byId.has(UNCAT_ID)) {
      byId.set(UNCAT_ID, { id: UNCAT_ID, title: "Без категории", parentId: null });
    }

    const allowed = new Set<string>();
    for (const [id, n] of counts) if (n > 0) allowed.add(id);

    return { byId, counts, allowed };
  }

  get filteredProducts(): Product[] {
    if (!this.selectedCategoryId) return this.products;
    return this.products.filter((p) => p.categoryId === this.selectedCategoryId);
  }

  private get productComparator() {
    const sortKey = this.sort;

    return (a: Product, b: Product) => {
      if (sortKey === "nameAsc") return compareText(a.name, b.name);
      if (sortKey === "nameDesc") return compareText(b.name, a.name);

      const priceCmp =
        sortKey === "priceAsc"
          ? cmpNumNullLastAsc(a.price, b.price)
          : -cmpNumNullLastAsc(a.price, b.price);

      return priceCmp || compareText(a.name, b.name);
    };
  }

  get sortedProducts(): Product[] {
    const cmp = this.productComparator;
    return this.filteredProducts
      .map((p, idx) => ({ p, idx }))
      .sort((A, B) => cmp(A.p, B.p) || (A.idx - B.idx))
      .map((x) => x.p);
  }

  // Pagination
  get totalCount() {
    return this.sortedProducts.length;
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  get safePage() {
    return clamp(this.page, 1, this.totalPages);
  }

  get pagedProducts(): Product[] {
    const start = (this.safePage - 1) * this.pageSize;
    return this.sortedProducts.slice(start, start + this.pageSize);
  }

  // UI
  get visiblePagedCount() {
    return this.pagedProducts.reduce((acc, p) => acc + (p.available ? 1 : 0), 0);
  }

  get skeletonCount() {
    return this.totalCount > 0 ? this.visiblePagedCount : this.pageSize;
  }

  private clearUiLoading() {
    if (this.uiTimer) clearTimeout(this.uiTimer);
    this.uiTimer = null;
    this.uiLoading = false;
  }

  private pulseUiLoading(ms = 500) {
    if (this.status !== "success") return;

    this.uiLoading = true;

    if (this.uiTimer) clearTimeout(this.uiTimer);
    this.uiTimer = setTimeout(() => {
      runInAction(() => this.clearUiLoading());
    }, ms);
  }

  private commit(
    apply: () => void,
    opts: { resetPage?: boolean; clampPage?: boolean } = {}
  ) {
    this.pulseUiLoading();
    apply();

    if (opts.resetPage) this.page = 1;
    if (opts.clampPage) this.page = clamp(this.page, 1, this.totalPages);
  }

  setSort(key: SortKey) {
    if (this.sort === key) return;
    this.commit(() => (this.sort = key), { resetPage: true });
  }

  setCategory(id: string) {
    if (this.selectedCategoryId === id) return;
    this.commit(() => (this.selectedCategoryId = id), { resetPage: true });
  }

  setPage(next: number) {
    const raw = Math.max(1, Math.floor(next));

    const n = this.status === "success" ? clamp(raw, 1, this.totalPages) : raw;

    if (this.page === n) return;
    this.commit(() => (this.page = n));
  }

  setPageSize(size: number) {
    const s = Math.max(1, Math.floor(size));
    if (this.pageSize === s) return;
    this.commit(() => (this.pageSize = s), { resetPage: true });
  }

  private normalizeFiltersAfterLoad() {
    if (!this.selectedCategoryId) return;
    const n = this.categoryMeta.counts.get(this.selectedCategoryId) ?? 0;
    if (n === 0) this.selectedCategoryId = "";
  }

  load = flow(function* (this: CatalogStore) {
    this.clearUiLoading();

    if (this.status === "success" && this.products.length) return;
    this.status = "loading";
    this.error = null;

    try {
      const data = yield fetchCatalog({ feedUrl: "https://www.iqos.ru/mindbox_feed.xml" });

      this.categories = data.categories;
      this.products = data.products;

      this.normalizeFiltersAfterLoad();
      this.page = clamp(this.page, 1, this.totalPages);

      this.status = "success";
    } catch (e) {
      this.status = "error";
      this.error = e instanceof Error ? e.message : "Неизвестная ошибка загрузки.";
    }
  });
}

export const catalogStore = new CatalogStore();