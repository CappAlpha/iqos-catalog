import cn from "classnames";

import { Checkbox } from "@/shared/ui/Checkbox";

import type { FilterGroup } from "../../model/types";

import s from "./FiltersGroup.module.scss";

interface Props {
  filterGroups: FilterGroup[];
  selectedCategoryId: string | null;
  toggleCategory: (id: string) => void;
  className?: string;
}

export const FiltersGroup = ({
  filterGroups,
  selectedCategoryId,
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
              {categories.map((category) => (
                <Checkbox
                  key={category.id}
                  checked={selectedCategoryId === category.id}
                  onChange={() => toggleCategory(category.id)}
                  label={`${category.title}`}
                />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
};
