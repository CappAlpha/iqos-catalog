import type { ProductGroup } from "../../model/types";
import { VariantsColors } from "../VariantColors";
import { VariantsSizes } from "../VariantSizes";

import s from "./ProductVariants.module.scss";

interface Props {
  productGroup: ProductGroup;
  selectedIdx: number;
  isPending: boolean;
  onSelect: (idx: number) => void;
  onExpand?: () => void;
  forceShowAllColors?: boolean;
}

export const ProductVariants = ({
  productGroup,
  selectedIdx,
  isPending,
  onSelect,
  onExpand,
  forceShowAllColors,
}: Props) => {
  const { type, variants } = productGroup;

  if (variants.length <= 1) {
    return null;
  }

  return (
    <div className={s.root}>
      {type === "color" ? (
        <VariantsColors
          variants={variants}
          selectedIdx={selectedIdx}
          isPending={isPending}
          onSelect={onSelect}
          onExpand={onExpand}
          forceShowAll={forceShowAllColors}
        />
      ) : (
        <VariantsSizes
          variants={variants}
          selectedIdx={selectedIdx}
          isPending={isPending}
          onSelect={onSelect}
        />
      )}
    </div>
  );
};
