import { useRef, useState } from 'react';
import { Button } from '../../../../../shared/ui/Button';
import s from './FiltersMobile.module.scss';
import cn from 'classnames';
import { observer } from 'mobx-react-lite';
import { catalogStore } from '../../model/catalogStore';
import { FiltersGroup } from '../FiltersGroup';
import { useOutsideClick } from '../../../../../shared/hooks/useOutsideClick';

export const FiltersMobile = observer(() => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  useOutsideClick(() => setIsOpen(false), wrapRef);

  const { isLoading, filterGroups, selectedCategoryId, setCategory, resetFilters } = catalogStore;

  const handleSetCategory = (id: string) => {
    setCategory(id);
    setIsOpen(false);
  };

  const handleResetFilters = () => {
    resetFilters();
    setIsOpen(false);
  };

  return (
    <>
      <Button onClick={() => setIsOpen(!isOpen)} className={s.btn} loading={isLoading}>Фильтры</Button>

      <div className={cn(s.root, isOpen && s.open)}>
        <div className={s.overlay} />
        <div ref={wrapRef} className={s.wrap}>
          <h3 className={s.title}>Фильтры</h3>

          <div className={s.filters}>
            <FiltersGroup className={s.filtersGroup} filterGroups={filterGroups} selectedCategoryId={selectedCategoryId} toggleCategory={handleSetCategory} />
          </div>

          <Button className={s.resetBtn} color='transparent' onClick={handleResetFilters}>Сбросить фильтры</Button>
        </div>

        <Button className={s.closeBtn} noPadding color='transparent' onClick={() => setIsOpen(false)}>&#10006;</Button>
      </div>
    </>
  );
});