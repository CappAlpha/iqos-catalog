import { useEffect, useRef } from "react";
import { useSearchParams, useLocation } from "react-router";

import { catalogM } from "../model/catalogM";
import { normalizeSort, normalizePage } from "./catalogPage";

export const useCatalogUrlSync = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const isInternalNav = useRef(false);

  const {
    selectedCategoryId,
    sort,
    page,
    status,
    setCategory,
    setSort,
    setPage,
  } = catalogM;

  // Store -> URL
  useEffect(() => {
    if (status !== "success") return;

    const nextParams = new URLSearchParams(searchParams);
    const defaultSort = normalizeSort(null);

    const updates = [
      { key: "cat", val: selectedCategoryId },
      { key: "sort", val: sort === defaultSort ? null : sort },
      { key: "page", val: page > 1 ? String(page) : null },
    ];

    let hasChanged = false;
    updates.forEach(({ key, val }) => {
      const current = nextParams.get(key);
      if (val !== current) {
        if (val) {
          nextParams.set(key, val);
        } else {
          nextParams.delete(key);
        }
        hasChanged = true;
      }
    });

    if (hasChanged) {
      isInternalNav.current = true;
      setSearchParams(nextParams, { replace: true });
    }
  }, [selectedCategoryId, sort, page, status, searchParams, setSearchParams]);

  // URL -> Store
  useEffect(() => {
    if (isInternalNav.current) {
      isInternalNav.current = false;
      return;
    }

    const params = new URLSearchParams(location.search);

    // TODO: normalize too?
    const urlCat = params.get("cat") ?? null;
    const urlSort = normalizeSort(params.get("sort"));
    const urlPage = normalizePage(params.get("page"));

    if (selectedCategoryId !== urlCat) setCategory(urlCat);
    if (sort !== urlSort) setSort(urlSort);
    if (page !== urlPage) setPage(urlPage);
  }, [
    page,
    selectedCategoryId,
    sort,
    location,
    setCategory,
    setSort,
    setPage,
    location.search,
  ]);
};
