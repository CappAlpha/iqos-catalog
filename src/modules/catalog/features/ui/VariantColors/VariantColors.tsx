import cn from "classnames";

import { useMobileM } from "@/shared/hooks/useBreakpoint";
import { Button } from "@/shared/ui/Button";

import { getColorHex } from "../../lib/getColorHex";
import type { ProductGroup } from "../../model/types";

import s from "./VariantColors.module.scss";

const MAX_VISIBLE_COLORS = 7;

interface Props {
  variants: ProductGroup["variants"];
  selectedIdx: number;
  isPending: boolean;
  onSelect: (idx: number) => void;
  onExpand?: () => void;
  forceShowAll?: boolean;
}

export const VariantsColors = ({
  variants,
  selectedIdx,
  isPending,
  onSelect,
  onExpand,
  forceShowAll,
}: Props) => {
  const isMobileM = useMobileM();
  const hasMore =
    !forceShowAll && !isMobileM && variants.length > MAX_VISIBLE_COLORS;

  return (
    <div className={s.root} onClick={(e) => e.stopPropagation()}>
      {variants.map(({ id, variantLabel }, idx) => {
        const isHidden = hasMore && idx >= MAX_VISIBLE_COLORS;

        return (
          <button
            key={id}
            className={cn(
              s.colorBtn,
              selectedIdx === idx && s.activeColor,
              isHidden && s.hiddenColor,
            )}
            style={{ background: getColorHex(variantLabel) }}
            onClick={() => onSelect(idx)}
            disabled={isPending}
            aria-label={`Выбрать цвет: ${variantLabel}`}
          />
        );
      })}

      {hasMore && (
        <Button className={s.moreColorsBtn} onClick={onExpand}>
          +{variants.length - MAX_VISIBLE_COLORS}
        </Button>
      )}
    </div>
  );
};
