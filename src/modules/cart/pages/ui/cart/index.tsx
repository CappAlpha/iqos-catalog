import cn from "classnames";
import { observer } from "mobx-react-lite";

import { cartM } from "@/modules/cart/features/model/cartM";
import { CartItemCard } from "@/modules/cart/features/ui/CartItemCard";
import { formatPrice } from "@/shared/lib/formatPrice";
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
    clearCart,
  } = cartM;

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

      {isEmpty ? (
        <div className={s.emptyState}>
          <h2>Ваша корзина пуста</h2>
          <p>Добавьте товары из каталога, чтобы оформить заказ.</p>
          <Button noPadding>
            <TransitionNavLink to="/" className={s.link}>
              Перейти в каталог
            </TransitionNavLink>
          </Button>
        </div>
      ) : (
        <div className={cn(s.wrap, isCartClearing && s.emptyStateSkeleton)}>
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
                    <b>
                      Сумма: <span>{formatPrice(order.totalPrice)}</span>
                    </b>
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
