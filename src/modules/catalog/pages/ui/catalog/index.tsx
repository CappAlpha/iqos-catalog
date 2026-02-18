import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";
import cn from "classnames";

import { catalogStore } from "../../../features/model/catalogStore";
import { useTablet } from "../../../../../shared/hooks/useBreakpoint";

import { CatalogGrid } from "../../../features/ui/CatalogGrid";
import { Pagination } from "../../../features/ui/Pagination";
import { CatalogHeader } from "../../../features/ui/CatalogHeader";
import { FiltersDesktop } from "../../../features/ui/FiltersDesktop";
import { FiltersDesktopSkeleton } from "../../../features/ui/FiltersDesktop/FiltersDesktopSkeleton";

import s from "./Catalog.module.scss";
import { useCatalogUrlSync } from "../../../features/lib/useCatalogUrlSync";

export const Catalog = observer(function Catalog() {
  const isTablet = useTablet();
  const topRef = useRef<HTMLDivElement | null>(null);

  useCatalogUrlSync();

  const {
    error,
    isLoading,
    totalPages,
    safePage,
    fetchData,
    setPage,
    isTransitioning
  } = catalogStore;

  useEffect(() => {
    fetchData();
  }, []);

  const onPageChange = (nextPage: number) => {
    setPage(nextPage);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const showSidebar = !isTablet && !error;

  return (
    <div className={s.root} ref={topRef}>
      <CatalogHeader isTablet={isTablet} />

      <div className={cn(s.wrap, error && s.wrapError)}>
        {showSidebar && (
          isLoading
            ? <FiltersDesktopSkeleton arrays={3} count={5} />
            : <FiltersDesktop />
        )}

        <CatalogGrid />
      </div>

      {!isLoading && !isTransitioning && totalPages > 1 && (
        <Pagination
          page={safePage}
          totalPages={totalPages}
          onChange={onPageChange}
        />
      )}
    </div>
  );
});