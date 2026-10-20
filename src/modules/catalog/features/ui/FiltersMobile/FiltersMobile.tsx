import clsx from "clsx";
import { observer } from "mobx-react-lite";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useOutsideClick } from "@/shared/hooks/useOutsideClick";
import { useScrollBlock } from "@/shared/hooks/useScrollBlock";
import { Button } from "@/shared/ui/Button";

import { catalogM } from "../../model/catalogM";
import { FiltersGroup } from "../FiltersGroup";

import s from "./FiltersMobile.module.scss";

interface IProps {
  className?: string;
  onApply: () => void;
}

export const FiltersMobile = observer(({ className, onApply }: IProps) => {
  const {
    isLoading,
    isAnyFilterSelected,
    pendingCategoryIds,
    beginPendingCategorySelection,
    togglePendingCategory,
    resetPendingCategories,
    applyPendingCategories,
  } = catalogM;

  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const handleOpen = () => {
    beginPendingCategorySelection();
    setIsOpen(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resetPendingCategories();
  };

  const handleApply = () => {
    setIsOpen(false);
    applyPendingCategories();
    window.requestAnimationFrame(onApply);
  };

  useScrollBlock(isOpen);

  useOutsideClick(() => {
    if (isOpen) handleCancel();
  }, wrapRef);

  return (
    <>
      {isLoading ? (
        <div className={clsx(s.btnSkeleton, className)} aria-hidden="true">
          Фильтры
        </div>
      ) : (
        <Button onClick={handleOpen} className={clsx(s.btn, className)}>
          Фильтры
          {isAnyFilterSelected && <span className={s.activeBadge} />}
        </Button>
      )}

      {createPortal(
        <div className={clsx(s.root, isOpen && s.open)}>
          <div className={s.overlay} aria-hidden="true" />

          <div ref={wrapRef} className={s.drawer}>
            <div className={s.header}>
              <h3 className={s.title}>Фильтры</h3>
              <Button
                className={s.closeIconBtn}
                onClick={handleCancel}
                color="transparent"
              >
                &#10006;
              </Button>
            </div>

            <div className={s.body}>
              <FiltersGroup
                selectedCategoryIds={pendingCategoryIds}
                onCategoryToggle={togglePendingCategory}
              />
            </div>

            <div className={s.footer}>
              <Button
                className={s.resetBtn}
                color="outline"
                onClick={resetPendingCategories}
                disabled={pendingCategoryIds.size === 0}
              >
                Сбросить
              </Button>
              <Button className={s.applyBtn} onClick={handleApply}>
                Готово
              </Button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
});
