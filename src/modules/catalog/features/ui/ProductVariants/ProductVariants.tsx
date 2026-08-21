import type { IProductGroup } from "../../model/types";
import { VariantsColors } from "../VariantColors";
import { VariantsSizes } from "../VariantSizes";

interface IProps {
  productGroup: IProductGroup;
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
}: IProps) => {
  const { type, variants } = productGroup;

  if (variants.length <= 1) {
    return null;
  }

  return (
    <>
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
    </>
  );
};
