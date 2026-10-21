import { observer } from "mobx-react-lite";
import type { RefObject } from "react";

import { catalogM } from "../../model/catalogM";
import { FilterSection } from "./FilterSection";

interface IProps {
  className?: string;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  selectedCategoryIds: ReadonlySet<string>;
  onCategoryToggle: (id: string) => void;
}

export const FiltersGroup = observer(
  ({
    className,
    scrollContainerRef,
    selectedCategoryIds,
    onCategoryToggle,
  }: IProps) => {
    const { categoryFilters } = catalogM;

    return (
      <>
        {categoryFilters.map((group) => {
          if (group.categories.length === 0) return null;

          return (
            <FilterSection
              key={group.key}
              className={className}
              group={group}
              scrollContainerRef={scrollContainerRef}
              selectedCategoryIds={selectedCategoryIds}
              onCategoryToggle={onCategoryToggle}
            />
          );
        })}
      </>
    );
  },
);
