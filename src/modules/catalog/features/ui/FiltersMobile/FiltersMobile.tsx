import cn from "classnames";
import { observer } from "mobx-react-lite";
import { useRef, useState } from "react";

import { useOutsideClick } from "@/shared/hooks/useOutsideClick";
import { Button } from "@/shared/ui/Button";

import { catalogM } from "../../model/catalogM";
import { FiltersGroup } from "../FiltersGroup";

import s from "./FiltersMobile.module.scss";

export const FiltersMobile = observer(() => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useOutsideClick(() => {
    if (isOpen) setIsOpen(false);
  }, wrapRef);

  const {
    isLoading,
    categoryFilters,
    selectedCategoryId,
    setCategory,
    resetFilters,
    isAnyFilterSelected,
  } = catalogM;

  const handleSetCategory = (id: string) => {
    setCategory(id);
    setIsOpen(false);
  };

  const handleResetFilters = () => {
    resetFilters();
    setIsOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={s.btn}
        loading={isLoading}
      >
        Фильтры
      </Button>

      <div className={cn(s.root, isOpen && s.open)}>
        <div className={s.overlay} aria-hidden="true" />
        <div ref={wrapRef} className={s.wrap}>
          <h3 className={s.title}>Фильтры</h3>

          <div className={s.filters}>
            <FiltersGroup
              className={s.filtersGroup}
              filterGroups={categoryFilters}
              selectedCategoryId={selectedCategoryId}
              toggleCategory={handleSetCategory}
            />
          </div>

          <Button
            className={s.resetBtn}
            color="transparent"
            onClick={handleResetFilters}
            disabled={!isAnyFilterSelected}
          >
            &#8635; Сбросить фильтры
          </Button>
        </div>

        <Button
          className={s.closeBtn}
          noPadding
          color="transparent"
          onClick={() => setIsOpen(false)}
        >
          &#10006;
        </Button>
      </div>
    </>
  );
});
