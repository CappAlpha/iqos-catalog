import { observer } from "mobx-react-lite";

import { Button } from "@/shared/ui/Button";

import { catalogM } from "../../model/catalogM";
import { FiltersGroup } from "../FiltersGroup";

import s from "./FiltersDesktop.module.scss";

export const FiltersDesktop = observer(() => {
  const {
    resetFilters,
    isAnyFilterSelected,
    selectedCategoryIds,
    toggleCategory,
  } = catalogM;

  return (
    <div className={s.root}>
      <h3 className={s.title}>
        <b>Фильтры</b>
      </h3>

      <FiltersGroup
        selectedCategoryIds={selectedCategoryIds}
        onCategoryToggle={toggleCategory}
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
