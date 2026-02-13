import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { catalogStore } from "../../../features/model/catalogStore";
import { CatalogGrid } from "../../../features/ui/CatalogGrid";
import { Pagination } from "../../../features/ui/Pagination";
import s from "./Catalog.module.scss";
import { CatalogHeader } from "../../../features/ui/CatalogHeader";
import { FiltersDesktop } from "../../../features/ui/FiltersDesktop";
import { useTablet } from "../../../../../shared/hooks/useBreakpoint";
import { normalizeSort, normalizePage, setOrDelete } from "../../../features/lib/catalogPage";
import { FiltersDesktopSkeleton } from "../../../features/ui/FiltersDesktop/FiltersDesktopSkeleton";
import cn from "classnames";

export const Catalog = observer(function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isTablet = useTablet();

  const topRef = useRef<HTMLDivElement | null>(null);

  const { isError, status, isLoading, selectedCategoryId, sort, page, safePage, totalPages, setCategory, setSort, load, setPage, categories } = catalogStore;

  // URL -> Store
  useEffect(() => {
    const cat = searchParams.get("cat") ?? "";
    const sortUrl = normalizeSort(searchParams.get("sort"));
    const pageUrl = normalizePage(searchParams.get("page"));

    if (selectedCategoryId !== cat) setCategory(cat);
    if (sortUrl !== sort) setSort(sortUrl);

    if (pageUrl !== page) setPage(pageUrl);
  }, [searchParams]);

  // Store -> URL
  useEffect(() => {
    if (status !== "success") return;

    const next = new URLSearchParams(searchParams);

    setOrDelete(next, "cat", selectedCategoryId, "");
    setOrDelete(next, "sort", sort, "nameAsc");

    if (safePage <= 1) next.delete("page");
    else next.set("page", String(safePage));

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [status, selectedCategoryId, sort, page, searchParams, setSearchParams]);

  useEffect(() => {
    load();
  }, []);

  const onPageChange = (page: number) => {
    setPage(page);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className={s.root} ref={topRef}>
      <CatalogHeader isTablet={isTablet} />

      <div className={cn(s.wrap, isError && s.wrapError)}>
        {(!isTablet && !isError) && (isLoading ? <FiltersDesktopSkeleton count={5} /> : <FiltersDesktop categories={categories} />)}
        <CatalogGrid />
      </div>

      {!isLoading && totalPages > 1 ? (
        <Pagination page={safePage} totalPages={totalPages} onChange={onPageChange} />
      ) : null}
    </div>
  );
});
