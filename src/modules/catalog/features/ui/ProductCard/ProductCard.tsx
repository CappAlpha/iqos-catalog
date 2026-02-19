"use client";

import cn from "classnames";


import s from "./ProductCard.module.scss";
import { Button } from "../../../../../shared/ui/Button";
import type { Product } from "../../model/types";

interface Props {
  product: Product;
}

export const ProductCard = ({ product }: Readonly<Props>) => {
  const { name, categoryTitle, price, pictureUrl } = product;

  return (
    <div
      className={cn(s.root)}
    >
      <div className={s.imgWrap}>
        {pictureUrl ? <img
          className={s.img}
          src={pictureUrl}
          alt={name}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
          : (
            <div className={s.placeholder} aria-hidden="true">
              Ошибка загрузки картинки
            </div>
          )}
      </div>

      <div className={s.textWrap}>
        <h5 className={s.title}>{name}</h5>
        {categoryTitle &&
          <p className={s.category}>{categoryTitle}</p>
        }
      </div>

      <div className={s.bottom}>
        <div className={s.bottomWrap}>
          <b className={s.price}>
            {price} &#8381;
          </b>
          <Button
          >
            Добавить
          </Button>
        </div>
      </div>
    </div>
  );
};
