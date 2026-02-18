

import { observer } from 'mobx-react-lite';
import { Checkbox } from '../../../../../shared/ui/Checkbox';
import s from './FiltersDesktop.module.scss';
import { catalogStore } from '../../model/catalogStore';

export const FiltersDesktop = observer(() => {
  const { filterGroups, selectedCategoryId, toggleCategory } = catalogStore;

  return (
    <div className={s.root}>
      <h3 className={s.title}>Фильтры</h3>

      {filterGroups.map(({ key, title, categories }) => {
        if (categories.length === 0) return null;

        return (
          <div key={key} className={s.categoriesWrap}>
            <h4 className={s.subtitle}>{title}</h4>
            <div className={s.categories}>
              {categories.map((category) =>
                <Checkbox key={category.id} checked={selectedCategoryId === category.id} onChange={() => toggleCategory(category.id)} label={`${category.title} (${category.count})`} />
              )}
            </div>
          </div>
        )
      })}
    </div>
  );
});