import cn from "classnames";
import { observer } from "mobx-react-lite";
import { useState } from "react";

import { formatPrice } from "@/shared/lib/formatPrice";

import { useVariantTransition } from "../../lib/useVariantTransition";
import type { ProductGroup } from "../../model/types";
import { AddCartButton } from "../AddCartButton";
import { ProductImage } from "../ProductImage/ProductImage";
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
    const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

    const selectedProduct = variants[selectedIdx];
    const { price, pictureUrl, categoryTitle } = selectedProduct;
    const isImageFallback = !pictureUrl || failedImageUrl === pictureUrl;

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
            <ProductImage
              src={pictureUrl}
              alt={baseName}
              type={type}
              variantLabel={selectedProduct.variantLabel}
              className={s.img}
              placeholderClassName={s.placeholder}
              loading={loading}
              isFallback={isImageFallback}
              onError={() => setFailedImageUrl(pictureUrl)}
            />
            {isImageFallback && (
              <p className={s.imageDisclaimer}>
                Изображение не загрузилось <br />
                Отображается пример товара
              </p>
            )}
          </div>

          <div className={s.textWrap}>
            <h5 className={s.title}>
              <b>{baseName}</b>
            </h5>
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
              <b className={cn(s.price, isPending && s.priceSkeleton)}>
                {formatPrice(price)}
              </b>

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
