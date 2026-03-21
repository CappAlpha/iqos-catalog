import cn from "classnames";
import { observer } from "mobx-react-lite";

import { cartM } from "@/modules/cart/features/model/cartM";
import { CartBlock } from "@/modules/cart/features/ui/CartBlock";
import { formatPrice } from "@/shared/lib/formatPrice";
import { Button } from "@/shared/ui/Button";

import s from "./CartPage.module.scss";

export const CartPage = observer(() => {
  const { isEmpty, orderHistory, getItemStatus, isCartClearing, clearCart } =
    cartM;

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

      {/* TODO: decompose? */}
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
