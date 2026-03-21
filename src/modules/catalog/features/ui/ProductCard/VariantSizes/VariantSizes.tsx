import cn from "classnames";

import { Button } from "@/shared/ui/Button";

import type { ProductGroup } from "../../../model/types";

import s from "./VariantSizes.module.scss";

interface Props {
  variants: ProductGroup["variants"];
  selectedIdx: number;
  isPending: boolean;
  onSelect: (idx: number) => void;
}

export const VariantsSizes = ({
  variants,
  selectedIdx,
  isPending,
  onSelect,
}: Props) => (
  <div className={s.root}>
    {variants.map(({ id, variantLabel }, idx) => (
      <Button
        key={id}
        className={cn(s.variantBtn, selectedIdx === idx && s.activeVariant)}
        onClick={() => onSelect(idx)}
        disabled={selectedIdx === idx || isPending}
      >
        {variantLabel}
      </Button>
    ))}
  </div>
);
