import cn from "classnames";
import { observer } from "mobx-react-lite";

import { cartM } from "@/modules/cart/features/model/cartM";
import { Button } from "@/shared/ui/Button";
import { CounterBtns } from "@/shared/ui/CounterBtns";

import type { Product } from "../../model/types";

import s from "./AddCartButton.module.scss";

interface Props {
  selectedProduct: Product;
  isPending?: boolean;
  className?: string;
}

export const AddCartButton = observer(
  ({ selectedProduct, isPending, className }: Props) => {
    const {
      setQuantity,
      addToCart,
      getCartItem,
      getItemState,
      canModify,
      isProductAvailable,
    } = cartM;

    const itemInCart = getCartItem(selectedProduct.id);

    if (!isProductAvailable(selectedProduct)) {
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <Button className={cn(s.button, className)} disabled>
            Нет в наличии
          </Button>
        </div>
      );
    }

    const {
      isAddLoading,
      isIncLoading,
      isDecLoading,
      isRemoveLoading,
      isCountChanged,
      canChangeQuantity,
    } = getItemState(selectedProduct.id);

    return (
      <div onClick={(e) => e.stopPropagation()}>
        {itemInCart ? (
          <CounterBtns
            className={cn(s.counter, className)}
            quantity={itemInCart.quantity}
            isDecLoading={isDecLoading || isRemoveLoading}
            isIncLoading={isIncLoading}
            isCountChanged={isCountChanged}
            onDecrease={() =>
              setQuantity(selectedProduct.id, itemInCart.quantity - 1)
            }
            onIncrease={() =>
              setQuantity(selectedProduct.id, itemInCart.quantity + 1)
            }
            disabled={!canChangeQuantity || isPending}
          />
        ) : (
          <Button
            className={cn(s.button, className)}
            loading={!canModify || isAddLoading}
            onClick={() => addToCart(selectedProduct)}
            disabled={!canModify || isPending}
          >
            Добавить
          </Button>
        )}
      </div>
    );
  },
);
