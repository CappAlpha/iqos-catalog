import cn from "classnames";
import { observer } from "mobx-react-lite";
import { useState } from "react";

import { formatPrice } from "@/shared/lib/formatPrice";
import { Button } from "@/shared/ui/Button";
import { CounterBtns } from "@/shared/ui/CounterBtns";
import { ImagePlaceholder } from "@/shared/ui/ImagePlaceholder";

import { cartM } from "../../model/cartM";
import type { CartItem } from "../../model/types";

import s from "./CartItemCard.module.scss";

interface Props {
  item: CartItem;
}

export const CartItemCard = observer(({ item }: Props) => {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const {
    product: { pictureUrl, name, categoryTitle, id, price },
    quantity,
  } = item;

  const { removeFromCart, setQuantity, getItemState } = cartM;

  const hasImageError = pictureUrl !== null && failedImageUrl === pictureUrl;

  const {
    isIncLoading,
    isDecLoading,
    isAddLoading,
    isRemoveLoading,
    isCountChanged,
    canChangeQuantity,
    canRemove,
  } = getItemState(id);

  return (
    <div
      className={cn(
        s.root,
        isAddLoading && s.cardAdding,
        isRemoveLoading && s.cardRemoving,
      )}
    >
      <div className={s.imgWrap}>
        {pictureUrl && !hasImageError ? (
          <img
            className={s.img}
            src={pictureUrl}
            alt={name}
            loading="lazy"
            onError={() => setFailedImageUrl(pictureUrl)}
          />
        ) : (
          <ImagePlaceholder className={s.placeholder} />
        )}
      </div>

      <div className={s.info}>
        <div className={s.header}>
          <h5 className={s.title}>
            <b>{name}</b>
          </h5>
          {categoryTitle && <p className={s.category}>{categoryTitle}</p>}
        </div>

        <div className={s.controlsContainer}>
          <CounterBtns
            quantity={quantity}
            isDecLoading={isDecLoading}
            isIncLoading={isIncLoading}
            isCountChanged={isCountChanged}
            onDecrease={() => setQuantity(id, quantity - 1)}
            onIncrease={() => setQuantity(id, quantity + 1)}
            disabled={!canChangeQuantity}
            className={s.counter}
          />

          {price != null && (
            <b className={cn(s.price, isCountChanged && s.updatingText)}>
              {formatPrice(price, quantity)}
            </b>
          )}

          <Button
            className={s.deleteBtn}
            onClick={() => removeFromCart(id)}
            color="transparent"
            aria-label="Удалить из корзины"
            loading={isRemoveLoading}
            disabled={!canRemove}
          >
            &#10005;
          </Button>
        </div>
      </div>
    </div>
  );
});
