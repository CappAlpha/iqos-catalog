import cn from "classnames";

import { Checkbox } from "@/shared/ui/Checkbox";

import type { FilterGroup } from "../../model/types";

import s from "./FiltersGroup.module.scss";

interface Props {
  filterGroups: FilterGroup[];
  selectedCategoryIds: string[];
  toggleCategory: (id: string) => void;
  className?: string;
}

export const FiltersGroup = ({
  filterGroups,
  selectedCategoryIds,
  toggleCategory,
  className,
}: Props) => {
  return (
    <>
      {filterGroups.map(({ key, title, categories }) => {
        if (categories.length === 0) return null;

        return (
          <div key={key} className={cn(s.root, className)}>
            <h4 className={s.title}>{title}</h4>
            <div className={s.categories}>
              {categories.map(({ id, title }) => (
                <Checkbox
                  key={id}
                  checked={selectedCategoryIds.includes(id)}
                  onChange={() => toggleCategory(id)}
                  label={title}
                />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
};
