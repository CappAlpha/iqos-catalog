import clsx from "clsx";
import { observer } from "mobx-react-lite";
import { useRef } from "react";

import { useCatalogUrlSync } from "@/modules/catalog/features/hooks/useCatalogUrlSync";
import { catalogM } from "@/modules/catalog/features/model/catalogM";
import { CatalogGrid } from "@/modules/catalog/features/ui/CatalogGrid";
import { CatalogHeader } from "@/modules/catalog/features/ui/CatalogHeader";
import { FiltersDesktop } from "@/modules/catalog/features/ui/FiltersDesktop";
import { Pagination } from "@/modules/catalog/features/ui/Pagination";
import { useTablet } from "@/shared/hooks/useBreakpoint";

import s from "./CatalogPage.module.scss";

const CatalogPage = observer(() => {
  const catalogRef = useRef<HTMLElement | null>(null);
  const isTablet = useTablet();

  const { isLoading, error, totalPages, safePage, setPage } = catalogM;
  const showDesktopFilters = !isTablet && !error;
  const showPagination = !error && !isLoading && totalPages > 1;

  useCatalogUrlSync();

  const scrollToCatalogTop = () => {
    catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    scrollToCatalogTop();
  };

  return (
    <main className={s.root} ref={catalogRef}>
      <CatalogHeader onScrollToTop={scrollToCatalogTop} />

      <div className={clsx(s.wrap, error && s.wrapError)}>
        {showDesktopFilters && <FiltersDesktop />}

        <CatalogGrid />
      </div>

      {showPagination && (
        <Pagination
          page={safePage}
          totalPages={totalPages}
          onChange={handlePageChange}
        />
      )}
    </main>
  );
});

export default CatalogPage;
