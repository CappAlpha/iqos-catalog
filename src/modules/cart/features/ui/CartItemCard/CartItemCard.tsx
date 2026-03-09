import cn from "classnames";
import { observer } from "mobx-react-lite";

import { Button } from "@/shared/ui/Button";
import { CounterBtns } from "@/shared/ui/CounterBtns";

import { cartStore } from "../../model/cartStore";
import type { CartItem } from "../../model/types";

import s from "./CartItemCard.module.scss";

interface Props {
  item: CartItem;
}

export const CartItemCard = observer(({ item }: Readonly<Props>) => {
  const {
    product: { pictureUrl, name, categoryTitle, id, price },
    quantity,
  } = item;
  const { removeFromCart, setQuantity, getItemAction } = cartStore;

  const action = getItemAction(id);

  const isIncLoading = action === "inc";
  const isDecLoading = action === "dec";
  const isRemoveLoading = action === "remove";

  const isCountChanged = isIncLoading || isDecLoading;

  return (
    <div className={cn(s.root, isRemoveLoading && s.cardRemoving)}>
      <div className={s.imgWrap}>
        {pictureUrl ? (
          <img className={s.img} src={pictureUrl} alt={name} />
        ) : (
          <div className={s.placeholder}>Нет фото</div>
        )}
      </div>

      <div className={s.info}>
        <div className={s.header}>
          <h5 className={s.title}>{name}</h5>
          {categoryTitle && <p className={s.category}>{categoryTitle}</p>}
        </div>

        <div className={s.controlsContainer}>
          <CounterBtns
            id={id}
            quantity={quantity}
            isDecLoading={isDecLoading}
            isIncLoading={isIncLoading}
            isCountChanged={isCountChanged}
            setQuantity={setQuantity}
            className={s.counter}
          />

          {price && (
            <b className={cn(s.price, isCountChanged && s.updatingText)}>
              {price * quantity} &#8381;
            </b>
          )}

          <Button
            className={s.deleteBtn}
            onClick={() => removeFromCart(id)}
            color="transparent"
            aria-label="Удалить из корзины"
            loading={isRemoveLoading}
          >
            &#10005;
          </Button>
        </div>
      </div>
    </div>
  );
});
