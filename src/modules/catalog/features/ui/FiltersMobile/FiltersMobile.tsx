import clsx from "clsx";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useOutsideClick } from "@/shared/hooks/useOutsideClick";
import { useScrollBlock } from "@/shared/hooks/useScrollBlock";
import { Button } from "@/shared/ui/Button";

import { FiltersGroup } from "../FiltersGroup";

import s from "./FiltersMobile.module.scss";

interface IProps {
  className?: string;
  loading: boolean;
  hasActiveFilters: boolean;
  onReset: () => void;
  onApply: () => void;
}

export const FiltersMobile = ({
  className,
  loading,
  hasActiveFilters,
  onReset,
  onApply,
}: IProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useScrollBlock(isOpen);

  useOutsideClick(() => {
    if (isOpen) setIsOpen(false);
  }, wrapRef);

  const handleApply = () => {
    setIsOpen(false);
    onApply();
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={clsx(s.btn, className)}
        loading={loading}
      >
        Фильтры
        {hasActiveFilters && <span className={s.activeBadge} />}
      </Button>

      {createPortal(
        <div className={clsx(s.root, isOpen && s.open)}>
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
              <FiltersGroup />
            </div>

            <div className={s.footer}>
              <Button
                className={s.resetBtn}
                color="outline"
                onClick={onReset}
                disabled={!hasActiveFilters}
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
};
