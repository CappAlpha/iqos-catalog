import cn from "classnames";
import { observer } from "mobx-react-lite";

import { Checkbox } from "@/shared/ui/Checkbox";

import { catalogM } from "../../model/catalogM";

import s from "./FiltersGroup.module.scss";

interface Props {
  className?: string;
}

export const FiltersGroup = observer(({ className }: Props) => {
  const { categoryFilters, selectedCategoryIds, toggleCategory } = catalogM;

  return (
    <>
      {categoryFilters.map(({ key, title, categories }) => {
        if (categories.length === 0) return null;

        return (
          <div key={key} className={cn(s.root, className)}>
            <h4 className={s.title}>{title}</h4>
            <div className={s.categories}>
              {categories.map(({ id, title }) => (
                <Checkbox
                  key={id}
                  checked={selectedCategoryIds.has(id)}
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
});
