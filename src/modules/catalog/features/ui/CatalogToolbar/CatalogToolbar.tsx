import clsx from "clsx";
import { observer } from "mobx-react-lite";

import { useTablet } from "@/shared/hooks/useBreakpoint";

import { useCatalogToolbarFloating } from "../../hooks/useCatalogToolbarFloating";
import { catalogM } from "../../model/catalogM";
import type { TSortKey } from "../../model/types";
import { CatalogSort } from "../CatalogSort";
import { FiltersMobile } from "../FiltersMobile";

import s from "./CatalogToolbar.module.scss";

interface IProps {
  onScrollToTop: () => void;
}

export const CatalogToolbar = observer(({ onScrollToTop }: IProps) => {
  const isTablet = useTablet();
  const { anchorRef, isFloating } = useCatalogToolbarFloating(isTablet);

  const { isLoading, isAnyFilterSelected, sort, setSort, resetFilters } =
    catalogM;

  const handleFiltersApply = () => {
    window.requestAnimationFrame(onScrollToTop);
  };

  const handleFiltersReset = () => {
    resetFilters();
    handleFiltersApply();
  };

  const handleSortChange = (nextSort: TSortKey) => {
    if (nextSort === sort) return;

    setSort(nextSort);
    if (isTablet) onScrollToTop();
  };

  return (
    <div ref={anchorRef} className={s.root}>
      <div className={clsx(s.controls, isFloating && s.floating)}>
        {isTablet && (
          <FiltersMobile
            className={s.filterButton}
            loading={isLoading}
            hasActiveFilters={isAnyFilterSelected}
            onReset={handleFiltersReset}
            onApply={handleFiltersApply}
          />
        )}

        <CatalogSort
          value={sort}
          onChange={handleSortChange}
          loading={isLoading}
          compact={isFloating}
        />
      </div>
    </div>
  );
});
