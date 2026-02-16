import { catalogStore } from '../../model/catalogStore';
import s from './CatalogHeader.module.scss';
import { Select } from '../../../../../shared/ui/Select';
import type { SortKey } from '../../model/types';
import { FiltersMobile } from '../FiltersMobile';
import { observer } from 'mobx-react-lite';
import { SelectSkeleton } from '../../../../../shared/ui/Select/SelectSkeleton';
import { SORT_OPTIONS } from '../../model/constants';

interface Props {
  isTablet: boolean;
}

export const CatalogHeader = observer(({ isTablet }: Props) => {
  const { error, isLoading, sort, setSort } = catalogStore;

  return (
    <div className={s.root}>
      <h1 className={s.title}>Каталог</h1>

      {!error && <div className={s.wrap}>
        {isTablet && <FiltersMobile />}
        {isLoading ? <SelectSkeleton /> : <Select
          value={sort}
          options={SORT_OPTIONS}
          onChange={(id) => setSort(id as SortKey)}
        />}
      </div>}
    </div>
  );
});