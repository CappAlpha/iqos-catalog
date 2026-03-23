import cn from "classnames";
import { observer } from "mobx-react-lite";

import { formatPrice } from "@/shared/lib/formatPrice";
import { Button } from "@/shared/ui/Button";

import { cartM } from "../../model/cartM";

import s from "./CartSidebar.module.scss";

export const CartSidebar = observer(() => {
  const { totalPrice, totalItems, checkout, isCartUpdating } = cartM;

  return (
    <aside className={s.sidebar}>
      <div className={s.summaryBox}>
        <h3 className={s.summaryTitle}>Сумма заказа</h3>
        <div className={s.summaryRow}>
          <p>
            Товары (
            <span className={cn(isCartUpdating && s.updatingText)}>
              {totalItems}
            </span>{" "}
            шт.)
          </p>
          <p>
            <span className={cn(isCartUpdating && s.updatingText)}>
              {formatPrice(totalPrice)}
            </span>{" "}
          </p>
        </div>
        <div className={s.summaryTotal}>
          <p>Итого</p>
          <p>
            <span className={cn(isCartUpdating && s.updatingText)}>
              {formatPrice(totalPrice)}
            </span>{" "}
          </p>
        </div>
        <Button className={s.checkoutBtn} onClick={checkout}>
          Оформить заказ
        </Button>
      </div>
    </aside>
  );
});
