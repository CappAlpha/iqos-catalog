

import { Checkbox } from '../../../../../shared/ui/Checkbox';
import type { Category } from '../../model/types';
import s from './FiltersDesktop.module.scss';

export interface Props {
  categories: Category[];
}

export const FiltersDesktop = ({ categories }: Props) => {
  // TODO: Remove
  const someCategories = categories.slice(0, 5);

  return (
    <div className={s.root}>
      <h3 className={s.title}>Фильтры</h3>

      <div className={s.categoriesWrap}>
        <h4 className={s.subtitle}>Устройство</h4>
        <div className={s.categories}>
          {someCategories.map((category) => (
            <Checkbox key={category.id} checked={false} onChange={() => { }} label={category.title} />
          ))}
        </div>
      </div>

      <div className={s.categoriesWrap}>
        <h4 className={s.subtitle}>Аксессуары и комплектующие</h4>
        <div className={s.categories}>
          {someCategories.map((category) => (
            <Checkbox key={category.id} checked={false} onChange={() => { }} label={category.title} />
          ))}
        </div>
      </div>
    </div>
  );
};