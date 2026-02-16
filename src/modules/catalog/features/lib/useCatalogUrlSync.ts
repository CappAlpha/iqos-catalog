import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { catalogStore } from "../model/catalogStore";
import { normalizeSort, normalizePage, syncUrlParam } from "./catalogPage";

export const useCatalogUrlSync = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    selectedCategoryId, sort, page, safePage, status,
    setCategory, setSort, setPage
  } = catalogStore;

  // URL -> Store 
  const catParam = searchParams.get("cat");
  const sortParam = searchParams.get("sort");
  const pageParam = searchParams.get("page");

  useEffect(() => {
    const nextCat = catParam ?? "";
    const nextSort = normalizeSort(sortParam);
    const nextPage = normalizePage(pageParam);

    if (selectedCategoryId !== nextCat) setCategory(nextCat);
    if (sort !== nextSort) setSort(nextSort);
    if (page !== nextPage) setPage(nextPage);

  }, [catParam, sortParam, pageParam]);

  // Store -> URL
  useEffect(() => {
    if (status !== "success") return;

    const nextParams = new URLSearchParams(searchParams);
    let changed = false;

    const syncParam = (key: string, value: string, defaultValue: string) => {
      const currentUrlValue = nextParams.get(key);
      const nextValue = value === defaultValue ? null : value;

      if (currentUrlValue !== nextValue) {
        syncUrlParam(nextParams, key, value, defaultValue);
        changed = true;
      }
    };

    syncParam("cat", selectedCategoryId ?? "", "");
    syncParam("sort", sort, "nameAsc");

    const currentPageStr = nextParams.get("page");
    if (safePage <= 1) {
      if (currentPageStr) {
        nextParams.delete("page");
        changed = true;
      }
    } else {
      if (currentPageStr !== String(safePage)) {
        nextParams.set("page", String(safePage));
        changed = true;
      }
    }

    if (changed) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [status, selectedCategoryId, sort, safePage, setSearchParams]);
};