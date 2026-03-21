import cn from "classnames";

import { useMobileM } from "@/shared/hooks/useBreakpoint";
import { Button } from "@/shared/ui/Button";

import { getColorHex } from "../../../lib/getColorHex";
import type { ProductGroup } from "../../../model/types";

import s from "./VariantColors.module.scss";

const MAX_VISIBLE_COLORS = 4;

interface Props {
  variants: ProductGroup["variants"];
  selectedIdx: number;
  isPending: boolean;
  onSelect: (idx: number) => void;
  isExpanded: boolean;
  onExpand: () => void;
}

export const VariantsColors = ({
  variants,
  selectedIdx,
  isPending,
  onSelect,
  isExpanded,
  onExpand,
}: Props) => {
  const isMobileM = useMobileM();
  const hasMore = !isMobileM && variants.length > MAX_VISIBLE_COLORS;

  return (
    <div className={s.root}>
      {variants.map(({ id, variantLabel }, idx) => {
        const isHidden = hasMore && !isExpanded && idx >= MAX_VISIBLE_COLORS;

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

      {hasMore && !isExpanded && (
        <Button className={s.moreColorsBtn} onClick={onExpand}>
          +{variants.length - MAX_VISIBLE_COLORS}
        </Button>
      )}
    </div>
  );
};
