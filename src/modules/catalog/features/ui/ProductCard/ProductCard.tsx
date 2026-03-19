import cn from "classnames";
import { observer } from "mobx-react-lite";
import { useState } from "react";

import { cartStore } from "@/modules/cart/features/model/cartStore";
import { Button } from "@/shared/ui/Button";
import { CounterBtns } from "@/shared/ui/CounterBtns";

import { useVariantTransition } from "../../lib/useVariantTransition";
import type { ProductGroup } from "../../model/types";
import { VariantsColors } from "./VariantColors";
import { VariantsSizes } from "./VariantSizes";

import s from "./ProductCard.module.scss";

interface Props {
  group: ProductGroup;
}

export const ProductCard = observer(({ group }: Readonly<Props>) => {
  const { selectedIdx, isPending, handleSelect } = useVariantTransition(
    group.variants,
  );
  const [isColorsExpanded, setIsColorsExpanded] = useState(false);

  const product = group.variants[selectedIdx];
  const { id, price, pictureUrl, categoryTitle } = product;

  const { removeFromCart, setQuantity, addToCart, getCartItem, getItemStatus } =
    cartStore;
  const itemInCart = getCartItem(id);
  const isNotInCart = !itemInCart;
  const {
    isAddLoading,
    isIncLoading,
    isDecLoading,
    isRemoveLoading,
    isCountChanged,
  } = getItemStatus(id);

  const isColorType = group.type === "color";

  return (
    <div className={cn(s.root)}>
      <div className={s.imgWrap}>
        {isPending && <div className={s.imgWrapSkeleton} />}
        {!isPending && pictureUrl ? (
          <img
            className={s.img}
            src={pictureUrl}
            alt={group.baseName}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className={s.placeholder} aria-hidden="true">
            Нет фото
          </div>
        )}
      </div>

      <div className={s.textWrap}>
        <h5 className={s.title}>{group.baseName}</h5>
        {isColorType && group.variants.length > 1 && (
          <h6 className={s.selectedColorName}>
            <span className={cn(isPending && s.selectedSkeleton)} />
            {product.variantLabel}
          </h6>
        )}
        {categoryTitle && <p className={s.category}>{categoryTitle}</p>}
      </div>

      <div className={s.bottom}>
        {group.variants.length > 1 &&
          (isColorType ? (
            <VariantsColors
              variants={group.variants}
              selectedIdx={selectedIdx}
              isPending={isPending}
              onSelect={handleSelect}
              isExpanded={isColorsExpanded}
              onExpand={() => setIsColorsExpanded(true)}
            />
          ) : (
            <VariantsSizes
              variants={group.variants}
              selectedIdx={selectedIdx}
              isPending={isPending}
              onSelect={handleSelect}
            />
          ))}

        <div className={s.bottomWrap}>
          <b className={cn(s.price, isPending && s.priceSkeleton)}>
            {price} &#8381;
          </b>
          {isNotInCart ? (
            <Button
              className={s.button}
              loading={isAddLoading}
              onClick={() => addToCart(product)}
            >
              Добавить
            </Button>
          ) : (
            <CounterBtns
              id={id}
              quantity={itemInCart.quantity ?? 0}
              isDecLoading={isDecLoading || isRemoveLoading}
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
