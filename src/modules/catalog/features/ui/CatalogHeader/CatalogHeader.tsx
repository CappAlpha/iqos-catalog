import { catalogStore } from '../../model/catalogStore';
import s from './CatalogHeader.module.scss';
import { Select } from '../../../../../shared/ui/Select';
import type { SortKey } from '../../model/types';
import { FiltersMobile } from '../FiltersMobile';
import { observer } from 'mobx-react-lite';
import { SelectSkeleton } from '../../../../../shared/ui/Select/SelectSkeleton';

const sortOptions = [
  { id: "nameAsc", label: "Название (A→Я)" },
  { id: "nameDesc", label: "Название (Я→A)" },
  { id: "priceAsc", label: "Цена (↑)" },
  { id: "priceDesc", label: "Цена (↓)" },
];

interface Props {
  isTablet: boolean;
}

export const CatalogHeader = observer(({ isTablet }: Props) => {
  const { sort, setSort, isError, isLoading } = catalogStore;

  return (
    <div className={s.root}>
      <h1 className={s.title}>Каталог</h1>

      {!isError && <div className={s.wrap}>
        {isTablet && <FiltersMobile />}
        {isLoading ? <SelectSkeleton /> : <Select
          value={sort}
          options={sortOptions}
          onChange={(id) => setSort(id as SortKey)}
        />}
      </div>}
    </div>
  );
});