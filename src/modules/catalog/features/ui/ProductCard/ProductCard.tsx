import cn from "classnames";
import { observer } from "mobx-react-lite";
import { useState } from "react";

import { formatPrice } from "@/shared/lib/formatPrice";

import { useVariantTransition } from "../../lib/useVariantTransition";
import type { ProductGroup } from "../../model/types";
import { AddCartButton } from "../AddCartButton";
import { ProductModal } from "../ProductModal";
import { ProductVariants } from "../ProductVariants";

import s from "./ProductCard.module.scss";

interface Props {
  productGroup: ProductGroup;
  loading: "eager" | "lazy";
}

export const ProductCard = observer(
  ({ productGroup, loading }: Readonly<Props>) => {
    const { baseName, type, variants } = productGroup;

    const { selectedIdx, isPending, handleSelect } =
      useVariantTransition(variants);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const selectedProduct = variants[selectedIdx];
    const { price, pictureUrl, categoryTitle } = selectedProduct;

    const onClose = (e?: MouseEvent | KeyboardEvent) => {
      if ((e?.target as Element)?.closest(".toast-root")) {
        return;
      }
      setIsModalOpen(false);
    };

    return (
      <>
        <div className={s.root} onClick={() => setIsModalOpen(true)}>
          <div className={s.imgWrap}>
            {isPending && <div className={s.imgWrapSkeleton} />}
            {pictureUrl ? (
              <img
                key={pictureUrl}
                className={s.img}
                src={pictureUrl}
                alt={baseName}
                loading={loading}
              />
            ) : (
              <div className={s.placeholder} aria-hidden="true">
                Нет фото
              </div>
            )}
          </div>

          <div className={s.textWrap}>
            <h5 className={s.title}>{baseName}</h5>
            {type === "color" && variants.length > 1 && (
              <h6 className={s.selectedColorName}>
                <span className={cn(isPending && s.selectedSkeleton)} />
                {selectedProduct.variantLabel}
              </h6>
            )}
            {categoryTitle && <p className={s.category}>{categoryTitle}</p>}
          </div>

          <div className={s.bottom}>
            <ProductVariants
              productGroup={productGroup}
              selectedIdx={selectedIdx}
              isPending={isPending}
              onSelect={handleSelect}
              onExpand={() => setIsModalOpen(true)}
            />

            <div className={s.bottomWrap}>
              {price && (
                <b className={cn(s.price, isPending && s.priceSkeleton)}>
                  {formatPrice(price)}
                </b>
              )}

              <AddCartButton
                selectedProduct={selectedProduct}
                isPending={isPending}
              />
            </div>
          </div>
        </div>

        {isModalOpen && (
          <ProductModal
            productGroup={productGroup}
            selectedIdx={selectedIdx}
            isPending={isPending}
            onSelect={handleSelect}
            onClose={onClose}
          />
        )}
      </>
    );
  },
);
