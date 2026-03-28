import cn from "classnames";
import { observer } from "mobx-react-lite";
import { useRef, useState } from "react";

import { useOutsideClick } from "@/shared/hooks/useOutsideClick";
import { useScrollBlock } from "@/shared/hooks/useScrollBlock";
import { Button } from "@/shared/ui/Button";

import { catalogM } from "../../model/catalogM";
import { FiltersGroup } from "../FiltersGroup";

import s from "./FiltersMobile.module.scss";

export const FiltersMobile = observer(() => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useScrollBlock(isOpen);

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
  };

  const handleResetFilters = () => {
    resetFilters();
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={s.btn}
        loading={isLoading}
      >
        Фильтры
        {isAnyFilterSelected && <span className={s.activeBadge} />}
      </Button>

      <div className={cn(s.root, isOpen && s.open)}>
        <div className={s.overlay} aria-hidden="true" />

        <div ref={wrapRef} className={s.drawer}>
          <div className={s.header}>
            <h3 className={s.title}>Фильтры</h3>
            <Button
              className={s.closeIconBtn}
              onClick={() => setIsOpen(false)}
              color="transparent"
            >
              &#10006;
            </Button>
          </div>

          <div className={s.body}>
            <FiltersGroup
              className={s.filtersGroup}
              filterGroups={categoryFilters}
              selectedCategoryId={selectedCategoryId}
              toggleCategory={handleSetCategory}
            />
          </div>

          <div className={s.footer}>
            <Button
              className={s.resetBtn}
              color="outline"
              onClick={handleResetFilters}
              disabled={!isAnyFilterSelected}
            >
              Сбросить
            </Button>
            <Button className={s.applyBtn} onClick={() => setIsOpen(false)}>
              Готово
            </Button>
          </div>
        </div>
      </div>
    </>
  );
});
