import { observer } from "mobx-react-lite";

import { Button } from "../../../../../shared/ui/Button";
import { catalogStore } from "../../model/catalogStore";
import { FiltersGroup } from "../FiltersGroup";

import s from "./FiltersDesktop.module.scss";

export const FiltersDesktop = observer(() => {
  const { filterGroups, selectedCategoryId, toggleCategory, resetFilters } =
    catalogStore;

  return (
    <div className={s.root}>
      <h3 className={s.title}>Фильтры</h3>

      <FiltersGroup
        filterGroups={filterGroups}
        selectedCategoryId={selectedCategoryId}
        toggleCategory={toggleCategory}
      />

      <Button
        className={s.resetBtn}
        noPadding
        color="transparent"
        onClick={resetFilters}
      >
        &#8635; Сбросить фильтры
      </Button>
    </div>
  );
});
