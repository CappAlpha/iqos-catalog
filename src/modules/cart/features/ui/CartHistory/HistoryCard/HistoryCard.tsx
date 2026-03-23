import cn from "classnames";
import { observer } from "mobx-react-lite";

import { formatPrice } from "@/shared/lib/formatPrice";

import { cartM } from "../../../model/cartM";
import type { Order } from "../../../model/types";

import s from "./HistoryCard.module.scss";

interface Props {
  order: Order;
}

export const HistoryCard = observer(({ order }: Props) => {
  return (
    <div
      className={cn(
        s.root,
        cartM.getItemStatus(order.id).isAddLoading && s.cardIntro,
      )}
    >
      <div className={s.header}>
        <p className={s.title}>
          <b>Заказ #{order.id}</b>
        </p>
        <p className={s.date}>
          {new Date(order.date).toLocaleDateString("ru-RU")}
        </p>
      </div>
      <div className={s.total}>
        <p>
          <b>
            Сумма: <span>{formatPrice(order.totalPrice)}</span>
          </b>
        </p>
      </div>
    </div>
  );
});
