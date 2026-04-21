import { runInAction } from "mobx";
import { useEffect } from "react";
import { useSearchParams } from "react-router";

import { catalogM } from "../model/catalogM";
import { normalizeSort, normalizePage } from "./catalogPage";

export const useCatalogUrlSync = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentCatsStr = catalogM.selectedCategoriesQuery;
  const currentSort = catalogM.sort;
  const currentPage = catalogM.page;
  const status = catalogM.status;

  // Store -> URL
  useEffect(() => {
    if (status !== "success") return;

    setSearchParams(
      (prevParams) => {
        const nextParams = new URLSearchParams(prevParams);
        const defaultSort = normalizeSort(null);

        const updates = [
          { key: "cat", val: currentCatsStr || null },
          {
            key: "sort",
            val: currentSort === defaultSort ? null : currentSort,
          },
          { key: "page", val: currentPage > 1 ? String(currentPage) : null },
        ];

        let hasChanged = false;
        updates.forEach(({ key, val }) => {
          const current = nextParams.get(key);
          if (val !== current) {
            if (val) nextParams.set(key, val);
            else nextParams.delete(key);
            hasChanged = true;
          }
        });

        return hasChanged ? nextParams : prevParams;
      },
      { replace: true },
    );
  }, [currentCatsStr, currentSort, currentPage, status, setSearchParams]);

  // URL -> Store
  useEffect(() => {
    const urlCatRaw = searchParams.get("cat");
    const urlCats = urlCatRaw ? urlCatRaw.split(",") : [];
    const urlCatsStr = [...urlCats].sort().join(",");

    const urlSort = normalizeSort(searchParams.get("sort"));
    const urlPage = normalizePage(searchParams.get("page"));

    const storeCatsStr = catalogM.selectedCategoriesQuery;

    runInAction(() => {
      if (storeCatsStr !== urlCatsStr) {
        catalogM.selectedCategoryIds.clear();
        urlCats.forEach((id) => catalogM.setCategory(id));
      }

      if (catalogM.sort !== urlSort) catalogM.setSort(urlSort);
      if (catalogM.page !== urlPage) catalogM.setPage(urlPage);
    });
  }, [searchParams]);
};
