import { observer } from "mobx-react-lite";
import { useRef } from "react";

import { Button } from "@/shared/ui/Button";

import { catalogM } from "../../model/catalogM";
import { FiltersGroup } from "../FiltersGroup";
import { FiltersDesktopSkeleton } from "./FiltersDesktopSkeleton";

import s from "./FiltersDesktop.module.scss";

export const FiltersDesktop = observer(() => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const {
    isLoading,
    resetFilters,
    isAnyFilterSelected,
    selectedCategoryIds,
    toggleCategory,
  } = catalogM;

  return (
    <div className={s.root}>
      <h3 className={s.title}>
        <b>Фильтры</b>
      </h3>

      <div className={s.body} ref={scrollContainerRef}>
        {isLoading ? (
          <FiltersDesktopSkeleton arrays={3} count={5} />
        ) : (
          <FiltersGroup
            scrollContainerRef={scrollContainerRef}
            selectedCategoryIds={selectedCategoryIds}
            onCategoryToggle={toggleCategory}
          />
        )}
      </div>

      <Button
        className={s.resetBtn}
        noPadding
        color="transparent"
        onClick={resetFilters}
        disabled={isLoading || !isAnyFilterSelected}
      >
        &#8635; Сбросить фильтры
      </Button>
    </div>
  );
});
