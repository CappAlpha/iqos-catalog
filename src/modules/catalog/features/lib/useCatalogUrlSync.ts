import { runInAction, reaction } from "mobx";
import { useEffect } from "react";
import { useSearchParams } from "react-router";

import { catalogM } from "../model/catalogM";
import { normalizeSort, normalizePage, getCleanCatsParam } from "./catalogPage";

export const useCatalogUrlSync = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL -> Store
  useEffect(() => {
    const urlCatRaw = searchParams.get("cat");
    const urlCatsStr = getCleanCatsParam(urlCatRaw);
    const urlSort = normalizeSort(searchParams.get("sort"));
    const urlPage = normalizePage(searchParams.get("page"));

    runInAction(() => {
      if (catalogM.selectedCategoriesQuery !== urlCatsStr) {
        catalogM.selectedCategoryIds.clear();
        if (urlCatRaw) {
          urlCatRaw.split(",").forEach((id) => catalogM.setCategory(id));
        }
      }

      if (catalogM.sort !== urlSort) catalogM.setSort(urlSort);
      if (catalogM.page !== urlPage) catalogM.setPage(urlPage);
    });
  }, [searchParams]);

  // Store -> URL
  useEffect(() => {
    const dispose = reaction(
      () => ({
        catsStr: catalogM.selectedCategoriesQuery,
        sort: catalogM.sort,
        page: catalogM.page,
        isSuccess: catalogM.catalogQuery.isSuccess,
        totalPages: catalogM.totalPages,
      }),
      ({ catsStr, sort, page, isSuccess, totalPages }) => {
        if (!isSuccess) return;

        const maxPage = totalPages || 1;

        if (page > maxPage) {
          runInAction(() => {
            catalogM.setPage(maxPage);
          });
          return;
        }

        setSearchParams(
          (prevParams) => {
            const nextParams = new URLSearchParams(prevParams);

            const updates = {
              cat: getCleanCatsParam(catsStr),
              sort: sort === normalizeSort(null) ? null : sort,
              page: page > 1 ? String(page) : null,
            };

            let hasChanged = false;

            for (const [key, value] of Object.entries(updates)) {
              if (nextParams.get(key) !== value) {
                if (value === null) {
                  nextParams.delete(key);
                } else {
                  nextParams.set(key, value);
                }
                hasChanged = true;
              }
            }

            return hasChanged ? nextParams : prevParams;
          },
          { replace: true },
        );
      },
    );

    return dispose;
  }, [setSearchParams]);
};
