import { observer } from "mobx-react-lite";

import { Select } from "@/shared/ui/Select";
import { SelectSkeleton } from "@/shared/ui/Select/SelectSkeleton";

import { catalogStore } from "../../model/catalogStore";
import { SORT_OPTIONS } from "../../model/constants";
import type { SortKey } from "../../model/types";
import { FiltersMobile } from "../FiltersMobile";

import s from "./CatalogHeader.module.scss";

interface Props {
  isTablet: boolean;
}

export const CatalogHeader = observer(({ isTablet }: Props) => {
  const { error, isLoading, sort, setSort } = catalogStore;

  return (
    <div className={s.root}>
      <h1 className={s.title}>Каталог</h1>

      {!error && (
        <div className={s.wrap}>
          {isTablet && <FiltersMobile />}
          {isLoading ? (
            <SelectSkeleton />
          ) : (
            <Select
              value={sort}
              options={SORT_OPTIONS}
              onChange={(id) => setSort(id as SortKey)}
            />
          )}
        </div>
      )}
    </div>
  );
});
