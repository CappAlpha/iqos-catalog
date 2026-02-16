

import { observer } from 'mobx-react-lite';
import { catalogStore } from '../../model/catalogStore';
import { CatalogGridSkeleton } from './CatalogGridSkeleton';
import { ProductCard } from '../ProductCard';
import s from './CatalogGrid.module.scss';
import { Button } from '../../../../../shared/ui/Button';

export const CatalogGrid = observer(() => {
  const { error, showSkeleton, totalCount, viewProducts, fetchData, skeletonCount } = catalogStore;

  if (error) return (
    <div className={s.errorWrap}>
      <div className={s.errorTitle}>Не удалось загрузить каталог</div>
      <div className={s.errorText}>{error}</div>
      <Button className={s.reloadBtn} onClick={() => fetchData()}>
        Повторить
      </Button>
    </div>
  );

  if (showSkeleton) return (
    <CatalogGridSkeleton count={skeletonCount} />
  );

  if (totalCount === 0) return (
    <div className={s.errorWrap}>Ничего не найдено по выбранному фильтру.</div>
  );

  return (
    <div className={s.grid}>
      {viewProducts.map((product) => (
        product.available && <ProductCard key={product.id} product={product} />
      ))}
    </div >
  );
});