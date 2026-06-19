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
    isEmpty,
    pagedProductGroups,
    catalogQuery,
    skeletonCount,
  } = catalogM;

  if (error)
    return (
      <div className={s.errorWrap}>
        <div className={s.errorTitle}>
          <b>Не удалось загрузить каталог</b>
        </div>
        <div className={s.errorText}>
          Проверьте подключение к интернету или попробуйте позже
        </div>
        <Button className={s.reloadBtn} onClick={() => catalogQuery.refetch()}>
          Повторить
        </Button>
      </div>
    );

  if (showSkeleton) return <CatalogGridSkeleton count={skeletonCount} />;

  if (isEmpty)
    return (
      <div className={s.errorWrap}>
        Ничего не найдено по выбранному фильтру.
      </div>
    );

  return (
    <div className={s.grid}>
      {pagedProductGroups.map((productGroup, i) => (
        <ProductCard
          key={productGroup.id}
          productGroup={productGroup}
          loading={i < 4 ? "eager" : "lazy"}
        />
      ))}
    </div>
  );
});
