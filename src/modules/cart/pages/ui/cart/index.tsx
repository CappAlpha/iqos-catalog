import cn from "classnames";
import { observer } from "mobx-react-lite";

import { cartStore } from "@/modules/cart/features/model/cartStore.ts";
import { CartItemCard } from "@/modules/cart/features/ui/CartItemCard";
import { Button } from "@/shared/ui/Button";
import { TransitionNavLink } from "@/shared/ui/TransitionNavLink";

import s from "./Cart.module.scss";

export const Cart = observer(() => {
  const {
    items,
    totalPrice,
    totalItems,
    isEmpty,
    checkout,
    orderHistory,
    isCartUpdating,
    getItemStatus,
    isCartClearing,
  } = cartStore;

  return (
    <div className={s.root}>
      <h1 className={s.title}>Корзина</h1>

      {isEmpty || isCartClearing ? (
        <div
          className={cn(s.emptyState, isCartClearing && s.emptyStateSkeleton)}
        >
          <h2>Ваша корзина пуста</h2>
          <p>Добавьте товары из каталога, чтобы оформить заказ.</p>
          <Button noPadding>
            <TransitionNavLink to="/" className={s.link}>
              Перейти в каталог
            </TransitionNavLink>
          </Button>
        </div>
      ) : (
        <div className={s.wrap}>
          <div className={s.itemsList}>
            {items.map((item) => (
              <CartItemCard key={item.product.id} item={item} />
            ))}
          </div>

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
                    {totalPrice}
                  </span>{" "}
                  &#8381;
                </p>
              </div>
              <div className={s.summaryTotal}>
                <p>Итого</p>
                <p>
                  <span className={cn(isCartUpdating && s.updatingText)}>
                    {totalPrice}
                  </span>{" "}
                  &#8381;
                </p>
              </div>
              <Button className={s.checkoutBtn} onClick={checkout}>
                Оформить заказ
              </Button>
            </div>
          </aside>
        </div>
      )}

      {orderHistory.length > 0 && (
        <div className={s.historySection}>
          <h2 className={s.historyTitle}>История заказов</h2>
          <div className={s.historyList}>
            {orderHistory.map((order) => (
              <div
                key={order.id}
                className={cn(
                  s.historyCard,
                  getItemStatus(order.id).isAddLoading && s.historyCardIntro,
                )}
              >
                <div className={s.historyHeader}>
                  <p className={s.orderTitle}>
                    <b>Заказ #{order.id}</b>
                  </p>
                  <p className={s.orderDate}>
                    {new Date(order.date).toLocaleDateString()}
                  </p>
                </div>
                <div className={s.historyTotal}>
                  <p>
                    <b>Сумма: {order.totalPrice} &#8381;</b>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
