

import { observer } from 'mobx-react-lite';
import { catalogStore } from '../../model/catalogStore';
import { CatalogGridSkeleton } from './CatalogGridSkeleton';
import { ProductCard } from '../ProductCard';
import s from './CatalogGrid.module.scss';
import { Button } from '../../../../../shared/ui/Button';

export const CatalogGrid = observer(() => {
  const { isError, error, status, isLoading, uiLoading, totalCount, pagedProducts, load, skeletonCount, products } = catalogStore;

  const isInitial = status === 'idle' && products.length === 0;
  const showSkeleton = isInitial || isLoading || uiLoading;

  return (
    <>
      {isError ? (
        <div className={s.errorWrap}>
          <div className={s.errorTitle}>Не удалось загрузить каталог</div>
          <div className={s.errorText}>{error}</div>
          <Button className={s.reloadBtn} onClick={() => load()}>
            Повторить
          </Button>
        </div>
      ) : (
        <>
          {showSkeleton ? (
            <CatalogGridSkeleton count={skeletonCount} />
          ) : totalCount === 0 ? (
            <div className={s.errorWrap}>Ничего не найдено по выбранному фильтру.</div>
          ) : (
            <div className={s.grid}>
              {pagedProducts.map((product) => (
                product.available && <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
});