import { useEffect, useRef } from "react";
import { useSearchParams, useLocation } from "react-router";

import { catalogM } from "../model/catalogM";
import { normalizeSort, normalizePage } from "./catalogPage";

export const useCatalogUrlSync = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const isInternalNavRef = useRef(false);

  const {
    selectedCategoryIds,
    sort,
    page,
    status,
    setCategory,
    setSort,
    setPage,
  } = catalogM;

  const catValString =
    selectedCategoryIds.size > 0
      ? Array.from(selectedCategoryIds).join(",")
      : null;

  // Store -> URL
  useEffect(() => {
    if (status !== "success") return;

    const nextParams = new URLSearchParams(searchParams);
    const defaultSort = normalizeSort(null);

    const sortVal = sort === defaultSort ? null : sort;
    const pageVal = page > 1 ? String(page) : null;

    const updates = [
      { key: "cat", val: catValString },
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
      isInternalNavRef.current = true;
      setSearchParams(nextParams, { replace: true });
    }
  }, [catValString, sort, page, status, searchParams, setSearchParams]);

  // URL -> Store
  useEffect(() => {
    if (isInternalNavRef.current) {
      isInternalNavRef.current = false;
      return;
    }

    const params = new URLSearchParams(location.search);

    const urlCatRaw = params.get("cat");
    const urlCats = urlCatRaw ? urlCatRaw.split(",") : [];

    const urlSort = normalizeSort(params.get("sort"));
    const urlPage = normalizePage(params.get("page"));

    const currentCatsStr = Array.from(selectedCategoryIds).join(",");
    const urlCatsStr = [...urlCats].join(",");

    if (currentCatsStr !== urlCatsStr) {
      selectedCategoryIds.clear();
      urlCats.forEach((id) => {
        setCategory(id);
      });
    }

    if (sort !== urlSort) setSort(urlSort);
    if (page !== urlPage) setPage(urlPage);
  }, [
    location.search,
    sort,
    page,
    setCategory,
    setSort,
    setPage,
    selectedCategoryIds,
  ]);
};
