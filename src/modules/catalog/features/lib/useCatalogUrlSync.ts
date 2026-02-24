import { useEffect, useRef } from "react";
import { useSearchParams, useLocation } from "react-router";
import { catalogStore } from "../model/catalogStore";
import { normalizeSort, normalizePage } from "./catalogPage";

export const useCatalogUrlSync = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const isInternalNav = useRef(false);

  const { selectedCategoryId, sort, page, status } = catalogStore;
  const defaultSort = normalizeSort(null);

  // Store -> URL
  useEffect(() => {
    if (status !== "success") return;

    const currentUrlCat = searchParams.get("cat") ?? "";
    const currentUrlSort = searchParams.get("sort");
    const currentUrlPage = searchParams.get("page");

    const targetCat = selectedCategoryId ?? "";
    const targetSort = sort === defaultSort ? null : sort;
    const targetPage = page <= 1 ? null : String(page);

    if (
      currentUrlCat !== targetCat ||
      (currentUrlSort || null) !== (targetSort || null) ||
      (currentUrlPage || null) !== (targetPage || null)
    ) {
      const nextParams = new URLSearchParams(searchParams);

      if (targetCat) nextParams.set("cat", targetCat);
      else nextParams.delete("cat");

      if (targetSort) nextParams.set("sort", targetSort);
      else nextParams.delete("sort");

      if (targetPage) nextParams.set("page", targetPage);
      else nextParams.delete("page");

      isInternalNav.current = true;
      setSearchParams(nextParams, { replace: true });
    }
  }, [selectedCategoryId, sort, page, status, defaultSort, searchParams, setSearchParams]);


  // URL -> Store
  useEffect(() => {
    if (isInternalNav.current) {
      isInternalNav.current = false;
      return;
    }

    const currentParams = new URLSearchParams(location.search);
    const urlCat = currentParams.get("cat") ?? "";
    const urlSort = normalizeSort(currentParams.get("sort"));
    const urlPage = normalizePage(currentParams.get("page"));

    if ((catalogStore.selectedCategoryId ?? "") !== urlCat) {
      catalogStore.setCategory(urlCat === "" ? null : urlCat);
    }

    if (catalogStore.sort !== urlSort) {
      catalogStore.setSort(urlSort);
    }

    if (catalogStore.page !== urlPage) {
      catalogStore.setPage(urlPage);
    }
  }, [location.search]);
};