import { useEffect, useRef } from "react";
import { useSearchParams, useLocation } from "react-router";

import { catalogM } from "../model/catalogM";
import { normalizeSort, normalizePage } from "./catalogPage";

export const useCatalogUrlSync = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const isInternalNav = useRef(false);

  const {
    selectedCategoryIds,
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

    const catVal =
      selectedCategoryIds.length > 0 ? selectedCategoryIds.join(",") : null;
    const sortVal = sort === defaultSort ? null : sort;
    const pageVal = page > 1 ? String(page) : null;

    const updates = [
      { key: "cat", val: catVal },
      { key: "sort", val: sortVal },
      { key: "page", val: pageVal },
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

    if (hasChanged) {
      isInternalNav.current = true;
      setSearchParams(nextParams, { replace: true });
    }
  }, [selectedCategoryIds, sort, page, status, searchParams, setSearchParams]);

  // URL -> Store
  useEffect(() => {
    if (isInternalNav.current) {
      isInternalNav.current = false;
      return;
    }

    const params = new URLSearchParams(location.search);

    // TODO: normalize too?
    const urlCatRaw = params.get("cat");
    const urlCats = urlCatRaw ? urlCatRaw.split(",") : [];

    const urlSort = normalizeSort(params.get("sort"));
    const urlPage = normalizePage(params.get("page"));

    if (JSON.stringify(selectedCategoryIds) !== JSON.stringify(urlCats)) {
      urlCats.forEach((id) => setCategory(id));
    }
    if (sort !== urlSort) setSort(urlSort);
    if (page !== urlPage) setPage(urlPage);
  }, [
    page,
    selectedCategoryIds,
    sort,
    location,
    setCategory,
    setSort,
    setPage,
    location.search,
  ]);
};
