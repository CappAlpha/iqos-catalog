import clsx from "clsx";
import { observer } from "mobx-react-lite";
import type { RefObject } from "react";

import { Button } from "@/shared/ui/Button";
import { Checkbox } from "@/shared/ui/Checkbox";

import { useFiltersExpansion } from "../../hooks/useFiltersExpansion";
import type { IFilterGroup } from "../../model/types";

import s from "./FiltersGroup.module.scss";

interface IProps {
  className?: string | undefined;
  group: IFilterGroup;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  selectedCategoryIds: ReadonlySet<string>;
  onCategoryToggle: (id: string) => void;
}

const VISIBLE_CATEGORIES_COUNT = 5;

export const FilterSection = observer(
  ({
    className,
    group,
    scrollContainerRef,
    selectedCategoryIds,
    onCategoryToggle,
  }: IProps) => {
    const { isExpanded, toggleExpanded, handleExpandEnd } =
      useFiltersExpansion(scrollContainerRef);
    const { title, categories } = group;
    const hasMore = categories.length > VISIBLE_CATEGORIES_COUNT;
    const checkboxes = categories.map(({ id, title }) => (
      <Checkbox
        key={id}
        checked={selectedCategoryIds.has(id)}
        onChange={() => onCategoryToggle(id)}
        label={title}
      />
    ));

    return (
      <div className={clsx(s.root, className)}>
        <h4 className={s.title}>
          <b>{title}</b>
        </h4>
        <div className={clsx(s.categories, s.collapsibleCategories)}>
          <div className={s.categoryList}>
            {checkboxes.slice(0, VISIBLE_CATEGORIES_COUNT)}
          </div>

          {hasMore && (
            <>
              <div
                className={clsx(s.extraCategories, isExpanded && s.expanded)}
                inert={!isExpanded}
                onTransitionEnd={handleExpandEnd}
              >
                <div className={s.extraCategoriesInner}>
                  <div className={s.categoryList}>
                    {checkboxes.slice(VISIBLE_CATEGORIES_COUNT)}
                  </div>
                </div>
              </div>

              <Button
                className={s.toggleBtn}
                color="transparent"
                noPadding
                onClick={toggleExpanded}
              >
                {isExpanded ? "Свернуть" : "Показать ещё"}
              </Button>
            </>
          )}
        </div>
      </div>
    );
  },
);
