import { observer } from "mobx-react-lite";

import { cartM } from "@/modules/cart/features/model/cartM";
import { CartBlock } from "@/modules/cart/features/ui/CartBlock";
import { CartHistory } from "@/modules/cart/features/ui/CartHistory";
import { Button } from "@/shared/ui/Button";

import s from "./CartPage.module.scss";

export const CartPage = observer(() => {
  const { isEmpty, isCartClearing, clearCart } = cartM;

  return (
    <div className={s.root}>
      <div className={s.topWrap}>
        <h1 className={s.title}>Корзина</h1>
        {!isEmpty && (
          <Button
            className={s.clearBtn}
            onClick={clearCart}
            loading={isCartClearing}
          >
            Очистить корзину
          </Button>
        )}
      </div>

      <CartBlock />

      <CartHistory />
    </div>
  );
});
