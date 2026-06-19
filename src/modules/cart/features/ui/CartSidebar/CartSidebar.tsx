import cn from "classnames";
import { observer } from "mobx-react-lite";

import { formatPrice } from "@/shared/lib/formatPrice";
import { pluralize } from "@/shared/lib/pluralize";
import { Button } from "@/shared/ui/Button";

import { cartM } from "../../model/cartM";

import s from "./CartSidebar.module.scss";

export const CartSidebar = observer(() => {
  const { totalPrice, uniqueItemsCount, totalItems, checkout, isCartUpdating } =
    cartM;

  const priceText = formatPrice(totalPrice);
  const itemsText = pluralize(uniqueItemsCount, "товар", "товара", "товаров");

  return (
    <aside className={s.sidebar}>
      <div className={s.summaryBox}>
        <h3 className={s.summaryTitle}>
          <b>Сумма заказа</b>
        </h3>
        <div className={s.summaryRow}>
          <p>
            <span className={cn(isCartUpdating && s.updatingText)}>
              {uniqueItemsCount}
            </span>{" "}
            {itemsText},{" "}
            <span className={cn(isCartUpdating && s.updatingText)}>
              {totalItems}
            </span>{" "}
            шт.
          </p>
          <p>
            <span className={cn(isCartUpdating && s.updatingText)}>
              {priceText}
            </span>{" "}
          </p>
        </div>
        <div className={s.summaryTotal}>
          <p>
            <b>Итого</b>
          </p>
          <p>
            <span className={cn(isCartUpdating && s.updatingText)}>
              <b>{priceText}</b>
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
