import cn from "classnames";

import { Button } from "../Button";

import s from "./CounterBtns.module.scss";

interface Props {
  id: string;
  quantity: number;
  isDecLoading: boolean;
  isIncLoading: boolean;
  isCountChanged: boolean;
  setQuantity: (id: string, quantity: number) => void;
  removeFromCart?: (id: string) => void;
  disabled?: boolean;
  canRemove?: boolean;
  className?: string;
}

export const CounterBtns = ({
  id,
  quantity,
  isDecLoading,
  isIncLoading,
  setQuantity,
  isCountChanged,
  removeFromCart,
  disabled,
  canRemove,
  className,
}: Props) => {
  const handleDec = () => {
    if (canRemove && quantity === 1) {
      removeFromCart?.(id);
    } else {
      setQuantity(id, quantity - 1);
    }
  };

  return (
    <div className={cn(s.root, className)}>
      <Button
        className={s.counterBtn}
        onClick={handleDec}
        disabled={disabled || (!canRemove && quantity <= 1)}
        loading={isDecLoading}
      >
        &#8722;
      </Button>

      <span className={cn(s.quantity, isCountChanged && s.updatingText)}>
        {quantity}
      </span>

      <Button
        className={s.counterBtn}
        onClick={() => setQuantity(id, quantity + 1)}
        disabled={disabled}
        loading={isIncLoading}
      >
        &#43;
      </Button>
    </div>
  );
};
