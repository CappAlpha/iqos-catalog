import clsx from "clsx";
import { observer } from "mobx-react-lite";

import { Checkbox } from "@/shared/ui/Checkbox";

import { catalogM } from "../../model/catalogM";

import s from "./FiltersGroup.module.scss";

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
        {categoryFilters.map(({ key, title, categories }) => {
          if (categories.length === 0) return null;

          return (
            <div key={key} className={clsx(s.root, className)}>
              <h4 className={s.title}>
                <b>{title}</b>
              </h4>
              <div className={s.categories}>
                {categories.map(({ id, title }) => (
                  <Checkbox
                    key={id}
                    checked={selectedCategoryIds.has(id)}
                    onChange={() => onCategoryToggle(id)}
                    label={title}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </>
    );
  },
);
