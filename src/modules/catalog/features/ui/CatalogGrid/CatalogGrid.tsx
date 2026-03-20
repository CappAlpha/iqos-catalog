import { observer } from "mobx-react-lite";

import { Button } from "@/shared/ui/Button";

import { catalogM } from "../../model/catalogM";
import { ProductCard } from "../ProductCard";
import { CatalogGridSkeleton } from "./CatalogGridSkeleton";

import s from "./CatalogGrid.module.scss";

export const CatalogGrid = observer(() => {
  const {
    error,
    showSkeleton,
    totalCount,
    pagedProductGroups,
    fetchData,
    skeletonCount,
  } = catalogM;

  if (error)
    return (
      <div className={s.errorWrap}>
        <div className={s.errorTitle}>Не удалось загрузить каталог</div>
        <div className={s.errorText}>{error}</div>
        <Button className={s.reloadBtn} onClick={() => fetchData()}>
          Повторить
        </Button>
      </div>
    );

  if (showSkeleton) return <CatalogGridSkeleton count={skeletonCount} />;

  if (totalCount === 0)
    return (
      <div className={s.errorWrap}>
        Ничего не найдено по выбранному фильтру.
      </div>
    );

  return (
    <div className={s.grid}>
      {pagedProductGroups.map((productGroup) => (
        <ProductCard key={productGroup.id} productGroup={productGroup} />
      ))}
    </div>
  );
});
