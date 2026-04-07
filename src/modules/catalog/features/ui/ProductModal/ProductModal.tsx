import cn from "classnames";
import { useRef } from "react";

import { useMobileM } from "@/shared/hooks/useBreakpoint";
import { useOnButtonDown } from "@/shared/hooks/useOnButtonDown";
import { useOutsideClick } from "@/shared/hooks/useOutsideClick";
import { useScrollBlock } from "@/shared/hooks/useScrollBlock";
import { formatPrice } from "@/shared/lib/formatPrice";
import { Button } from "@/shared/ui/Button";

import type { ProductGroup } from "../../model/types";
import { AddCartButton } from "../AddCartButton";
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
            {pictureUrl ? (
              <img
                key={pictureUrl}
                className={s.img}
                src={pictureUrl}
                alt={name}
                loading="eager"
              />
            ) : (
              <div className={s.placeholder} aria-hidden="true">
                Нет фото
              </div>
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
                <div dangerouslySetInnerHTML={{ __html: description }} />
              </div>
            )}

            {price && (
              <p className={s.price}>
                Цена:{" "}
                <b className={cn(isPending && s.priceSkeleton)}>
                  {formatPrice(price)}
                </b>{" "}
                шт.
              </p>
            )}

            <AddCartButton
              className={s.btn}
              selectedProduct={selectedProduct}
              isPending={isPending}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
