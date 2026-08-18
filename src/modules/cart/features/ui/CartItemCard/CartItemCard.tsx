import clsx from "clsx";
import { observer } from "mobx-react-lite";
import { useState } from "react";

import { TrashIcon } from "@/assets/icons";
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
    product: { pictureUrl, name, categoryTitle, id, price, available },
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
  } = getItemState(id);

  return (
    <div
      className={clsx(
        s.root,
        isAddLoading && s.cardAdding,
        isRemoveLoading && s.cardRemoving,
        !available && s.unavailable,
      )}
    >
      <div className={clsx(s.imgWrap, !available && s.unavailable)}>
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
        <div className={clsx(s.header, !available && s.unavailable)}>
          <h5 className={s.title}>
            <b>{name}</b>
          </h5>
          {categoryTitle && <p className={s.category}>{categoryTitle}</p>}
        </div>

        <div className={s.controlsContainer}>
          {!available ? (
            <p className={s.unavailableLabel}>
              <b>Нет в наличии</b>
            </p>
          ) : (
            <>
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
                <b className={clsx(s.price, isCountChanged && s.updatingText)}>
                  {formatPrice(price, quantity)}
                </b>
              )}
            </>
          )}

          <Button
            className={s.deleteBtn}
            onClick={() => removeFromCart(id)}
            color="transparent"
            aria-label="Удалить из корзины"
            loading={isRemoveLoading}
            disabled={!canChangeQuantity}
          >
            <TrashIcon />
          </Button>
        </div>
      </div>
    </div>
  );
});
