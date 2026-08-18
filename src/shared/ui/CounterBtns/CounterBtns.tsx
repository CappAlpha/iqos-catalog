import clsx from "clsx";

import { Button } from "../Button";

import s from "./CounterBtns.module.scss";

interface Props {
  quantity: number;
  isDecLoading: boolean;
  isIncLoading: boolean;
  isCountChanged: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  disabled?: boolean;
  className?: string;
}

export const CounterBtns = ({
  quantity,
  isDecLoading,
  isIncLoading,
  isCountChanged,
  onDecrease,
  onIncrease,
  disabled,
  className,
}: Props) => {
  return (
    <div className={clsx(s.root, className)}>
      <Button
        className={s.counterBtn}
        onClick={onDecrease}
        disabled={disabled}
        loading={isDecLoading}
      >
        &#8722;
      </Button>

      <span
        className={clsx(
          s.quantity,
          isCountChanged && s.updatingText,
          disabled && s.disabledText,
        )}
      >
        {quantity}
      </span>

      <Button
        className={s.counterBtn}
        onClick={onIncrease}
        disabled={disabled}
        loading={isIncLoading}
      >
        &#43;
      </Button>
    </div>
  );
};
