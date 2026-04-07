import cn from "classnames";
import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";

import { useCatalogUrlSync } from "@/modules/catalog/features/lib/useCatalogUrlSync";
import { catalogM } from "@/modules/catalog/features/model/catalogM";
import { CatalogGrid } from "@/modules/catalog/features/ui/CatalogGrid";
import { CatalogHeader } from "@/modules/catalog/features/ui/CatalogHeader";
import { FiltersDesktop } from "@/modules/catalog/features/ui/FiltersDesktop";
import { FiltersDesktopSkeleton } from "@/modules/catalog/features/ui/FiltersDesktop/FiltersDesktopSkeleton";
import { Pagination } from "@/modules/catalog/features/ui/Pagination";
import { useTablet } from "@/shared/hooks/useBreakpoint";

import s from "./CatalogPage.module.scss";

export const CatalogPage = observer(() => {
  const topRef = useRef<HTMLDivElement | null>(null);

  const { error, isLoading, fetchData, totalPages, safePage, setPage } =
    catalogM;

  const isTablet = useTablet();

  useCatalogUrlSync();

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const onPageChange = (nextPage: number) => {
    setPage(nextPage);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className={s.root} ref={topRef}>
      <CatalogHeader />

      <div className={cn(s.wrap, error && s.wrapError)}>
        {!isTablet &&
          !error &&
          (isLoading ? (
            <FiltersDesktopSkeleton arrays={3} count={5} />
          ) : (
            <FiltersDesktop />
          ))}

        <CatalogGrid />
      </div>

      {!error && !isLoading && totalPages > 1 && (
        <Pagination
          page={safePage}
          totalPages={totalPages}
          onChange={onPageChange}
        />
      )}
    </div>
  );
});
