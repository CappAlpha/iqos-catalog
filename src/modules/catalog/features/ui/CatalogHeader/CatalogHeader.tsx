import { observer } from "mobx-react-lite";

import { useTablet } from "@/shared/hooks/useBreakpoint";
import { Select } from "@/shared/ui/Select";
import { SelectSkeleton } from "@/shared/ui/Select/SelectSkeleton";

import { catalogM } from "../../model/catalogM";
import { SORT_OPTIONS } from "../../model/constants";
import { FiltersMobile } from "../FiltersMobile";

import s from "./CatalogHeader.module.scss";

export const CatalogHeader = observer(() => {
  const { error, isLoading, sort, setSort } = catalogM;
  const isTablet = useTablet();

  return (
    <div className={s.root}>
      <h1 className={s.title}>Каталог</h1>

      {!error && (
        <div className={s.wrap}>
          {isTablet && <FiltersMobile />}

          {isLoading ? (
            <SelectSkeleton />
          ) : (
            <Select value={sort} options={SORT_OPTIONS} onChange={setSort} />
          )}
        </div>
      )}
    </div>
  );
});
