import cn from "classnames";
import { observer } from "mobx-react-lite";
import { useState } from "react";

import { cartM } from "@/modules/cart/features/model/cartM";
import { formatPrice } from "@/shared/lib/formatPrice";
import { Button } from "@/shared/ui/Button";
import { CounterBtns } from "@/shared/ui/CounterBtns";

import { useVariantTransition } from "../../lib/useVariantTransition";
import type { ProductGroup } from "../../model/types";
import { VariantsColors } from "./VariantColors";
import { VariantsSizes } from "./VariantSizes";

import s from "./ProductCard.module.scss";

interface Props {
  productGroup: ProductGroup;
  loading: "eager" | "lazy";
}

export const ProductCard = observer(
  ({ productGroup, loading }: Readonly<Props>) => {
    const { selectedIdx, isPending, handleSelect } = useVariantTransition(
      productGroup.variants,
    );
    const [isColorsExpanded, setIsColorsExpanded] = useState(false);

    const selectedProduct = productGroup.variants[selectedIdx];
    const { id, price, pictureUrl, categoryTitle } = selectedProduct;

    const { setQuantity, addToCart, getCartItem, getItemStatus } = cartM;

    const itemInCart = getCartItem(id);

    const {
      isAddLoading,
      isIncLoading,
      isDecLoading,
      isRemoveLoading,
      isCountChanged,
    } = getItemStatus(id);

    const isColorType = productGroup.type === "color";

    return (
      <div className={cn(s.root)}>
        <div className={s.imgWrap}>
          {isPending && <div className={s.imgWrapSkeleton} />}
          {pictureUrl ? (
            <img
              key={pictureUrl}
              className={s.img}
              src={pictureUrl}
              alt={productGroup.baseName}
              loading={loading}
            />
          ) : (
            <div className={s.placeholder} aria-hidden="true">
              Нет фото
            </div>
          )}
        </div>

        <div className={s.textWrap}>
          <h5 className={s.title}>{productGroup.baseName}</h5>
          {isColorType && productGroup.variants.length > 1 && (
            <h6 className={s.selectedColorName}>
              <span className={cn(isPending && s.selectedSkeleton)} />
              {selectedProduct.variantLabel}
            </h6>
          )}
          {categoryTitle && <p className={s.category}>{categoryTitle}</p>}
        </div>

        <div className={s.bottom}>
          {productGroup.variants.length > 1 &&
            (isColorType ? (
              <VariantsColors
                variants={productGroup.variants}
                selectedIdx={selectedIdx}
                isPending={isPending}
                onSelect={handleSelect}
                isExpanded={isColorsExpanded}
                onExpand={() => setIsColorsExpanded(true)}
              />
            ) : (
              <VariantsSizes
                variants={productGroup.variants}
                selectedIdx={selectedIdx}
                isPending={isPending}
                onSelect={handleSelect}
              />
            ))}

          <div className={s.bottomWrap}>
            {price !== null && (
              <b className={cn(s.price, isPending && s.priceSkeleton)}>
                {formatPrice(price)}
              </b>
            )}
            {itemInCart ? (
              <CounterBtns
                id={id}
                quantity={itemInCart.quantity ?? 0}
                isDecLoading={isDecLoading || isRemoveLoading}
                isIncLoading={isIncLoading}
                isCountChanged={isCountChanged}
                setQuantity={setQuantity}
                disabled={isPending}
                className={s.counter}
              />
            ) : (
              <Button
                className={s.button}
                loading={isAddLoading}
                onClick={() => addToCart(selectedProduct)}
                disabled={isPending}
              >
                Добавить
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  },
);
