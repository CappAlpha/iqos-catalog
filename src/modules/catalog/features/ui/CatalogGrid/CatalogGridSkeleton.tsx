import { ProductCardSkeleton } from "../ProductCard/ProductCardSkeleton";

import s from "./CatalogGrid.module.scss";

interface IProps {
  count?: number;
}

export const CatalogGridSkeleton = ({ count = 12 }: IProps) => {
  return (
    <div className={s.grid} aria-label="Загрузка товаров">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};
