import { observer } from "mobx-react-lite";

import { catalogM } from "../../model/catalogM";
import { FilterSection } from "./FilterSection";

interface IProps {
  className?: string;
  selectedCategoryIds: ReadonlySet<string>;
  onCategoryToggle: (id: string) => void;
}

export const FiltersGroup = observer(
  ({ className, selectedCategoryIds, onCategoryToggle }: IProps) => {
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
              selectedCategoryIds={selectedCategoryIds}
              onCategoryToggle={onCategoryToggle}
            />
          );
        })}
      </>
    );
  },
);
