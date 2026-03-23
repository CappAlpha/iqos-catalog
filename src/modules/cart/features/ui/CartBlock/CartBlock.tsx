import cn from "classnames";
import { observer } from "mobx-react-lite";

import { formatPrice } from "@/shared/lib/formatPrice";
import { Button } from "@/shared/ui/Button";

import { cartM } from "../../model/cartM";
import { CartList } from "./CartList";

import s from "./CartBlock.module.scss";

export const CartBlock = observer(() => {
  const {
    totalPrice,
    totalItems,
    isEmpty,
    checkout,
    isCartUpdating,
    isCartClearing,
  } = cartM;

  return (
    <>
      {isEmpty ? (
        <div className={s.emptyState}>
          <h2>Ваша корзина пуста</h2>
          <p>Добавьте товары из каталога, чтобы оформить заказ.</p>
          <Button to="/" className={s.linkCatalog}>
            Перейти в каталог
          </Button>
        </div>
      ) : (
        <div className={cn(s.wrap, isCartClearing && s.emptyStateSkeleton)}>
          <CartList />

          {/* TODO: decompose? */}
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
        </div>
      )}
    </>
  );
});
