import { makeAutoObservable, observable, runInAction } from "mobx";

import { clamp } from "@/shared/lib/math";

import { fetchCatalog } from "../api/fetchCatalog";
import { getComparator } from "../lib/comparators";
import {
  CATALOG_DEFAULT,
  UNCAT_ID,
  GROUP_KEYWORDS,
  GROUP_TITLES,
  BLOCK_REGEX,
  CLEAN_NAME_REGEX,
  SIZE_VARIANT_REGEX,
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

  selectedCategoryIds = observable.set<string>();
  sort: SortKey = CATALOG_DEFAULT.sort;
  page = CATALOG_DEFAULT.page;
  pageSize = CATALOG_DEFAULT.pageSize;

  isTransitioning = false;
  #transitionTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get childrenMap(): Map<string, string[]> {
    const map = new Map<string, string[]>();
    for (const cat of this.categories) {
      if (cat.parentId) {
        const children = map.get(cat.parentId) ?? [];
        children.push(cat.id);
        map.set(cat.parentId, children);
      }
    }
    return map;
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

    (Object.entries(GROUP_KEYWORDS) as [FilterGroupKey, string[]][]).forEach(
      ([key, keywords]) => {
        const root = this.categories.find((cat) =>
          keywords.some((keyword) => cat.title.includes(keyword)),
        );
        map.set(key, root ? this.getAllChildIds([root.id]) : new Set());
      },
    );
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
      const groupId = childToParentId.get(product.categoryId ?? UNCAT_ID);
      if (groupId) counts.set(groupId, (counts.get(groupId) ?? 0) + 1);
    }

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

    for (const product of this.products) {
      const { groupId, baseName, type, variantLabel } =
        this.parseProductData(product);

      if (!groups.has(groupId)) {
        groups.set(groupId, { baseName, type, variants: [] });
      }
      groups.get(groupId)!.variants.push({ ...product, variantLabel });
    }

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

  get filteredProductGroups(): ProductGroup[] {
    if (this.selectedCategoryIds.size === 0) return this.baseProductGroups;

    const expandedIds: string[] = [];
    for (const group of this.groupedCategories) {
      if (group.ids.some((id) => this.selectedCategoryIds.has(id))) {
        expandedIds.push(...group.ids);
      }
    }

    const allowedIds = this.getAllChildIds(expandedIds);

    return this.baseProductGroups.reduce<ProductGroup[]>((acc, group) => {
      const filteredVariants = group.variants.filter((variant) =>
        allowedIds.has(variant.categoryId ?? UNCAT_ID),
      );

      if (filteredVariants.length > 0) {
        acc.push({ ...group, variants: filteredVariants });
      }
      return acc;
    }, []);
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
    return this.selectedCategoryIds.size > 0;
  }

  get skeletonCount() {
    return this.totalCount > 0 ? this.pagedProductGroups.length : this.pageSize;
  }

  private getAllChildIds(rootIds: string[]): Set<string> {
    const result = new Set(rootIds);
    const queue = [...rootIds];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = this.childrenMap.get(currentId);

      if (children) {
        for (const childId of children) {
          if (!result.has(childId)) {
            result.add(childId);
            queue.push(childId);
          }
        }
      }
    }
    return result;
  }

  private parseProductData(product: Product) {
    if (SIZE_VARIANT_REGEX.test(product.name)) {
      return {
        type: "size" as const,
        groupId: product.id,
        variantLabel: BLOCK_REGEX.test(product.name) ? "Блок" : "Пачка",
        baseName: product.name.replace(CLEAN_NAME_REGEX, "").trim(),
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

  setSort = (key: SortKey) => {
    if (this.sort === key) return;
    this.updateWithTransition(() => {
      this.sort = key;
      this.page = CATALOG_DEFAULT.page;
    });
  };

  setCategory = (id: string) => {
    this.updateWithTransition(() => {
      this.selectedCategoryIds.add(id);
      this.page = CATALOG_DEFAULT.page;
    });
  };

  toggleCategory = (id: string) => {
    this.updateWithTransition(() => {
      if (this.selectedCategoryIds.has(id)) {
        this.selectedCategoryIds.delete(id);
      } else {
        this.selectedCategoryIds.add(id);
      }
      this.page = CATALOG_DEFAULT.page;
    });
  };

  setPage = (n: number) => {
    this.triggerTransition();
    this.page = n;
  };

  resetFilters = () => {
    this.updateWithTransition(() => {
      this.selectedCategoryIds.clear();
      this.sort = CATALOG_DEFAULT.sort;
      this.page = CATALOG_DEFAULT.page;
    });
  };

  fetchData = async () => {
    if (this.#transitionTimer) clearTimeout(this.#transitionTimer);

    runInAction(() => {
      this.isTransitioning = false;
      this.status = "loading";
      this.error = null;
    });

    try {
      const data = await fetchCatalog();

      runInAction(() => {
        this.categories = data.categories;
        this.products = data.products;
        this.page = this.safePage;
        this.status = "success";
      });
    } catch (e) {
      runInAction(() => {
        this.status = "error";
        this.error = e instanceof Error ? e.message : "Ошибка загрузки";
      });
    }
  };
}

export const catalogM = new CatalogM();
