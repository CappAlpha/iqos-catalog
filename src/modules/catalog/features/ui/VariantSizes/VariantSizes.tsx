import clsx from "clsx";

import { Button } from "@/shared/ui/Button";

import type { IProductGroup } from "../../model/types";

import s from "./VariantSizes.module.scss";

interface IProps {
  variants: IProductGroup["variants"];
  selectedIdx: number;
  isPending: boolean;
  onSelect: (idx: number) => void;
}

export const VariantsSizes = ({
  variants,
  selectedIdx,
  isPending,
  onSelect,
}: IProps) => (
  <div className={s.root} onClick={(e) => e.stopPropagation()}>
    {variants.map(({ id, variantLabel }, idx) => (
      <Button
        key={id}
        className={clsx(s.variantBtn, selectedIdx === idx && s.activeVariant)}
        onClick={() => onSelect(idx)}
        disabled={selectedIdx === idx || isPending}
      >
        {variantLabel}
      </Button>
    ))}
  </div>
);
