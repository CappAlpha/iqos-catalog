import { makeAutoObservable, observable, runInAction } from "mobx";
import { Query } from "mobx-tanstack-query";
import { queryClient } from "mobx-tanstack-query/preset";

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
  FilterGroup,
  FilterGroupKey,
  MergedCategory,
  Product,
  ProductGroup,
  SortKey,
} from "./types";

class CatalogM {
  selectedCategoryIds = observable.set<string>();
  sort: SortKey = CATALOG_DEFAULT.sort;
  page = CATALOG_DEFAULT.page;
  pageSize = CATALOG_DEFAULT.pageSize;

  isTransitioning = false;
  #transitionTimer: ReturnType<typeof setTimeout> | null = null;

  readonly catalogQuery = new Query({
    queryClient,
    queryKey: ["catalog"],
    queryFn: ({ signal }) => fetchCatalog({ signal }),
    staleTime: 5 * 60 * 1000,
  });

  constructor() {
    makeAutoObservable(this);
  }

  get categories() {
    return this.catalogQuery.data?.categories ?? [];
  }

  get products() {
    return this.catalogQuery.data?.products ?? [];
  }

  get childrenMap(): Map<string, string[]> {
    const map = new Map<string, string[]>();

    for (const { id, parentId } of this.categories) {
      if (!parentId) continue;

      if (!map.has(parentId)) {
        map.set(parentId, []);
      }
      map.get(parentId)!.push(id);
    }

    return map;
  }

  get groupedCategories(): MergedCategory[] {
    const groups = Map.groupBy(this.categories, (cat) =>
      cat.title.trim().toLowerCase(),
    );

    return Array.from(groups.values(), (cats) => ({
      ...cats[0],
      ids: cats.map((c) => c.id),
    }));
  }

  get groupIdsMap(): Map<FilterGroupKey, Set<string>> {
    const map = new Map<FilterGroupKey, Set<string>>();

    for (const key of Object.keys(GROUP_KEYWORDS) as FilterGroupKey[]) {
      const root = this.categories.find(
        ({ title }) => GROUP_KEYWORDS[key] === title,
      );

      const childIds = root
        ? this.getAllChildIds([root.id])
        : new Set<string>();
      map.set(key, childIds);
    }

    return map;
  }

  get categoryFilters(): FilterGroup[] {
    const childToParentId = new Map<string, string>();
    for (const { id: parentId, ids } of this.groupedCategories) {
      for (const childId of ids) {
        childToParentId.set(childId, parentId);
      }
    }

    const counts = new Map<string, number>();
    for (const { categoryId } of this.products) {
      const parentId = childToParentId.get(categoryId ?? UNCAT_ID);
      if (parentId) {
        counts.set(parentId, (counts.get(parentId) ?? 0) + 1);
      }
    }

    const groupKeys = Object.keys(GROUP_KEYWORDS) as FilterGroupKey[];

    return groupKeys.map((key) => {
      const groupIds = this.groupIdsMap.get(key) ?? new Set();

      const categoriesInGroup = this.groupedCategories.flatMap(
        ({ id, title, ids }) => {
          const count = counts.get(id) ?? 0;
          const isInGroup = ids.some((childId) => groupIds.has(childId));

          if (isInGroup && count > 0) {
            return [{ id, title, count }];
          }
          return [];
        },
      );

      return {
        key,
        title: GROUP_TITLES[key],
        categories: categoriesInGroup,
      };
    });
  }

  get baseProductGroups(): ProductGroup[] {
    const parsedProducts = this.products.map((product) => ({
      ...product,
      meta: this.parseProductData(product),
    }));

    const groups = Map.groupBy(parsedProducts, (item) => item.meta.groupId);

    return Array.from(groups.values(), (items) => {
      const { baseName, type } = items[0].meta;

      const sortedItems =
        type === "size"
          ? items.toSorted((a, b) => (a.price ?? 0) - (b.price ?? 0))
          : items;

      const variants = sortedItems.map(({ meta, ...product }, i) => ({
        ...product,
        variantLabel: meta.variantLabel,
        originalId: product.id,
        id: `${product.id}_${i}`,
      }));

      return {
        id: items[0].id,
        baseName,
        type,
        variants,
      };
    });
  }

  get filteredProductGroups(): ProductGroup[] {
    if (this.selectedCategoryIds.size === 0) return this.baseProductGroups;

    const expandedIds = this.groupedCategories.flatMap((group) =>
      group.ids.some((id) => this.selectedCategoryIds.has(id)) ? group.ids : [],
    );

    const allowedIds = this.getAllChildIds(expandedIds);

    return this.baseProductGroups
      .map((group) => ({
        ...group,
        variants: group.variants.filter((v) =>
          allowedIds.has(v.categoryId ?? UNCAT_ID),
        ),
      }))
      .filter((group) => group.variants.length > 0);
  }

  get sortedProductGroups(): ProductGroup[] {
    const compare = getComparator(this.sort);
    return this.filteredProductGroups.toSorted((a, b) =>
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
    return this.catalogQuery.isLoading || this.isTransitioning;
  }

  get error() {
    return this.catalogQuery.error;
  }

  get isLoading() {
    return this.catalogQuery.isLoading;
  }

  get isEmpty() {
    return (
      this.catalogQuery.isSuccess && !this.showSkeleton && this.totalCount === 0
    );
  }

  get isAnyFilterSelected() {
    return this.selectedCategoryIds.size > 0;
  }

  get skeletonCount() {
    return this.totalCount > 0 ? this.pagedProductGroups.length : this.pageSize;
  }

  get selectedCategoriesQuery(): string {
    return Array.from(this.selectedCategoryIds)
      .sort((a, b) => a.localeCompare(b))
      .join(",");
  }

  private getAllChildIds(rootIds: string[]): Set<string> {
    const result = new Set<string>();

    const collect = (id: string) => {
      if (result.has(id)) return;
      result.add(id);

      const children = this.childrenMap.get(id);
      if (children) {
        for (const childId of children) {
          collect(childId);
        }
      }
    };

    rootIds.forEach(collect);
    return result;
  }

  private parseProductData({ id, name }: Product) {
    if (SIZE_VARIANT_REGEX.test(name)) {
      return {
        type: "size" as const,
        groupId: id,
        variantLabel: BLOCK_REGEX.test(name) ? "Блок" : "Пачка",
        baseName: name.replace(CLEAN_NAME_REGEX, "").trim(),
      };
    }

    const [baseName, variantLabel = "Стандарт"] = name.split(/\s*,\s*/);
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
}

export const catalogM = new CatalogM();
