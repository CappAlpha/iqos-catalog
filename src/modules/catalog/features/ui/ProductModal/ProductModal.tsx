import cn from "classnames";
import { useRef, useState } from "react";

import { useMobileM } from "@/shared/hooks/useBreakpoint";
import { useOnButtonDown } from "@/shared/hooks/useOnButtonDown";
import { useOutsideClick } from "@/shared/hooks/useOutsideClick";
import { useScrollBlock } from "@/shared/hooks/useScrollBlock";
import { formatPrice } from "@/shared/lib/formatPrice";
import { Button } from "@/shared/ui/Button";

import type { ProductGroup } from "../../model/types";
import { AddCartButton } from "../AddCartButton";
import { ProductImage } from "../ProductImage/ProductImage";
import { ProductVariants } from "../ProductVariants";

import s from "./ProductModal.module.scss";

interface ModalProps {
  productGroup: ProductGroup;
  selectedIdx: number;
  isPending: boolean;
  onSelect: (idx: number) => void;
  onClose: (e?: MouseEvent | KeyboardEvent) => void;
}

export const ProductModal = ({
  productGroup,
  selectedIdx,
  isPending,
  onSelect,
  onClose,
}: ModalProps) => {
  const selectedProduct = productGroup.variants[selectedIdx];
  const { name, description, pictureUrl, categoryTitle, price } =
    selectedProduct;

  const wrapRef = useRef<HTMLDivElement>(null);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const isImageFallback = !pictureUrl || failedImageUrl === pictureUrl;

  useScrollBlock(true);
  useOutsideClick(onClose, wrapRef);

  const isMobileM = useMobileM();
  useOnButtonDown("Escape", onClose, isMobileM);

  return (
    <div className={s.root}>
      <div className={s.modal} ref={wrapRef}>
        <Button
          className={s.closeBtn}
          onClick={() => onClose()}
          color="transparent"
          noPadding
        >
          &#10006;
        </Button>

        <div className={s.content}>
          <div className={s.imageBlock}>
            {isPending && <div className={s.imgSkeleton} />}
            <ProductImage
              src={pictureUrl}
              alt={name}
              type={productGroup.type}
              variantLabel={selectedProduct.variantLabel}
              className={s.img}
              placeholderClassName={s.placeholder}
              loading="eager"
              isFallback={isImageFallback}
              onError={() => setFailedImageUrl(pictureUrl)}
            />
            {isImageFallback && (
              <p className={s.imageDisclaimer}>
                Изображение не загрузилось. Показан примерный внешний вид
                товара.
              </p>
            )}
          </div>

          <div className={s.infoBlock}>
            {categoryTitle && <p className={s.category}>{categoryTitle}</p>}

            <h2 className={cn(s.title, isPending && s.titleSkeleton)}>
              {name}
            </h2>

            <ProductVariants
              productGroup={productGroup}
              selectedIdx={selectedIdx}
              isPending={isPending}
              onSelect={onSelect}
              forceShowAllColors
            />

            {description && (
              <div className={s.descriptionWrap}>
                <h4>Описание</h4>
                {/* eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml */}
                <div dangerouslySetInnerHTML={{ __html: description }} />
              </div>
            )}
          </div>
        </div>

        <div className={s.stickyFooter}>
          {price && (
            <div className={s.priceWrap}>
              <span className={s.priceLabel}>Цена:</span>
              <b className={cn(s.priceValue, isPending && s.priceSkeleton)}>
                {formatPrice(price)}
              </b>
              <span className={s.priceUnit}>шт.</span>
            </div>
          )}
          <AddCartButton
            className={s.btn}
            selectedProduct={selectedProduct}
            isPending={isPending}
          />
        </div>
      </div>
    </div>
  );
};
