import { observer } from "mobx-react-lite";

import { Button } from "@/shared/ui/Button";

import { cartM } from "../../model/cartM";

import s from "./CartHeader.module.scss";

export const CartHeader = observer(() => {
  const { isEmpty, isClearing, isInitialized, clearCart } = cartM;

  return (
    <div className={s.root}>
      <h1 className={s.title}>Корзина</h1>
      {isInitialized && !isEmpty && (
        <Button className={s.clearBtn} onClick={clearCart} loading={isClearing}>
          Очистить корзину
        </Button>
      )}
    </div>
  );
});
