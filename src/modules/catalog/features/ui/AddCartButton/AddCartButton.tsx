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
    const { setQuantity, addToCart, getCartItem, getItemStatus } = cartM;

    const itemInCart = getCartItem(selectedProduct.id);

    const {
      isAddLoading,
      isIncLoading,
      isDecLoading,
      isRemoveLoading,
      isCountChanged,
    } = getItemStatus(selectedProduct.id);

    return (
      <div onClick={(e) => e.stopPropagation()}>
        {itemInCart ? (
          <CounterBtns
            className={cn(s.counter, className)}
            id={selectedProduct.id}
            quantity={itemInCart.quantity}
            isDecLoading={isDecLoading || isRemoveLoading}
            isIncLoading={isIncLoading}
            isCountChanged={isCountChanged}
            setQuantity={setQuantity}
            disabled={isPending}
          />
        ) : (
          <Button
            className={cn(s.button, className)}
            loading={isAddLoading}
            onClick={() => addToCart(selectedProduct)}
            disabled={isPending}
          >
            Добавить
          </Button>
        )}
      </div>
    );
  },
);
