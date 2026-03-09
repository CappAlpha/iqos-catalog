import cn from "classnames";
import { observer } from "mobx-react-lite";

import { cartStore } from "@/modules/cart/features/model/cartStore";
import { Button } from "@/shared/ui/Button";
import { CounterBtns } from "@/shared/ui/CounterBtns";

import type { Product } from "../../model/types";

import s from "./ProductCard.module.scss";

interface Props {
  product: Product;
}

export const ProductCard = observer(({ product }: Readonly<Props>) => {
  const { id, name, categoryTitle, price, pictureUrl } = product;
  const { removeFromCart, items, setQuantity, addToCart, getItemAction } =
    cartStore;

  const itemInCart = items.find((i) => i.product.id === id);
  const action = getItemAction(id);

  const isAddToCartLoading = action === "add";
  const isIncLoading = action === "inc";
  const isDecLoading = action === "dec";
  const isRemoveFromCart = action === "remove";
  const isCountChanged = isIncLoading || isDecLoading;
  const isItemInCart = !itemInCart;

  return (
    <div className={cn(s.root)}>
      <div className={s.imgWrap}>
        {pictureUrl ? (
          <img
            className={s.img}
            src={pictureUrl}
            alt={name}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className={s.placeholder} aria-hidden="true">
            Ошибка загрузки картинки
          </div>
        )}
      </div>

      <div className={s.textWrap}>
        <h5 className={s.title}>{name}</h5>
        {categoryTitle && <p className={s.category}>{categoryTitle}</p>}
      </div>

      <div className={s.bottom}>
        <div className={s.bottomWrap}>
          <b className={s.price}>{price} &#8381;</b>
          {isItemInCart ? (
            <Button
              className={s.button}
              loading={isAddToCartLoading}
              onClick={() => addToCart(product)}
            >
              Добавить
            </Button>
          ) : (
            <CounterBtns
              id={id}
              quantity={itemInCart.quantity ?? 0}
              isDecLoading={isDecLoading || isRemoveFromCart}
              isIncLoading={isIncLoading}
              isCountChanged={isCountChanged}
              setQuantity={setQuantity}
              removeFromCart={removeFromCart}
              canRemove
              className={s.counter}
            />
          )}
        </div>
      </div>
    </div>
  );
});
