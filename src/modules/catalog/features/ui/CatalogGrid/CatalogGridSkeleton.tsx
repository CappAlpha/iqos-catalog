import { ProductCardSkeleton } from "../ProductCard/ProductCardSkeleton";
import s from "./CatalogGrid.module.scss";

export const CatalogGridSkeleton = ({ count = 12 }: { count?: number }) => {
  return (
    <div className={s.grid} aria-label="Загрузка товаров">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
