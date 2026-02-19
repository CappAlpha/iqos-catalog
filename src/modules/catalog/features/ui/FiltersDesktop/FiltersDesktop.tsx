

import { observer } from 'mobx-react-lite';
import s from './FiltersDesktop.module.scss';
import { catalogStore } from '../../model/catalogStore';
import { Button } from '../../../../../shared/ui/Button';
import { FiltersGroup } from '../FiltersGroup';

export const FiltersDesktop = observer(() => {
  const { filterGroups, selectedCategoryId, toggleCategory, resetFilters } = catalogStore;

  return (
    <div className={s.root}>
      <h3 className={s.title}>Фильтры</h3>

      <FiltersGroup filterGroups={filterGroups} selectedCategoryId={selectedCategoryId} toggleCategory={toggleCategory} />

      <Button className={s.resetBtn} noPadding color='transparent' onClick={resetFilters}>Сбросить фильтры</Button>
    </div>
  );
});