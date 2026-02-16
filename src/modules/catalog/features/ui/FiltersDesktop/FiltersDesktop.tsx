

import { observer } from 'mobx-react-lite';
import { Checkbox } from '../../../../../shared/ui/Checkbox';
import s from './FiltersDesktop.module.scss';
import { catalogStore } from '../../model/catalogStore';

export const FiltersDesktop = observer(() => {  
  const { categories, categoryWithCount, setCategory } = catalogStore;

  // TODO: refactor and move to store
  const categoriesFilter = categories.map((category) => ({
    id: category.id,
    title: category.title,
    count: categoryWithCount.counts.get(category.id) ?? 0,
  })).filter((category) => category.count > 0);

  const onCategoryChange = (id: string) => {
    setCategory(id);
  };

  return (
    <div className={s.root}>
      <h3 className={s.title}>Фильтры</h3>

      <div className={s.categoriesWrap}>
        <h4 className={s.subtitle}>Устройство</h4>
        <div className={s.categories}>
          {categoriesFilter.map((category) => (
            <Checkbox key={category.id} checked={false} onChange={() => onCategoryChange(category.id)} label={category.title + " " + categoryWithCount.counts.get(category.id)} />
          ))}
        </div>
      </div>

      {/* <div className={s.categoriesWrap}>
        <h4 className={s.subtitle}>Аксессуары и комплектующие</h4>
        <div className={s.categories}>
          {someCategories.map((category) => (
            <Checkbox key={category.id} checked={false} onChange={() => setCategory(category.id)} label={category.title} />
          ))}
        </div>
      </div> */}
    </div>
  );
});