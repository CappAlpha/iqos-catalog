import { observer } from "mobx-react-lite";

import { Button } from "@/shared/ui/Button";

import { catalogM } from "../../model/catalogM";
import { FiltersGroup } from "../FiltersGroup";

import s from "./FiltersDesktop.module.scss";

export const FiltersDesktop = observer(() => {
  const {
    categoryFilters,
    selectedCategoryId,
    toggleCategory,
    resetFilters,
    isAnyFilterSelected,
  } = catalogM;

  return (
    <div className={s.root}>
      <h3 className={s.title}>Фильтры</h3>

      <FiltersGroup
        filterGroups={categoryFilters}
        selectedCategoryId={selectedCategoryId}
        toggleCategory={toggleCategory}
      />

      <Button
        className={s.resetBtn}
        noPadding
        color="transparent"
        onClick={resetFilters}
        disabled={!isAnyFilterSelected}
      >
        &#8635; Сбросить фильтры
      </Button>
    </div>
  );
});
