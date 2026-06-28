import cn from "classnames";
import { observer } from "mobx-react-lite";
import { useState } from "react";

import { formatPrice } from "@/shared/lib/formatPrice";
import { Button } from "@/shared/ui/Button";

import { cartM } from "../../model/cartM";
import type { Order } from "../../model/types";

import s from "./HistoryCard.module.scss";

interface Props {
  order: Order;
}

export const HistoryCard = observer(({ order }: Props) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        s.root,
        cartM.getItemStatus(order.id).isAddLoading && s.cardIntro,
      )}
    >
      <div className={s.left}>
        <p className={s.title}>
          <b>Заказ #{order.id}</b>
        </p>
        <p className={s.date}>
          {new Date(order.date).toLocaleDateString("ru-RU")}
        </p>
      </div>

      <div className={s.right}>
        <div className={s.total}>
          <p>
            <b>
              Сумма: <span>{formatPrice(order.totalPrice)}</span>
            </b>
          </p>
        </div>
        <Button
          className={s.detailsBtn}
          color="outline"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "Свернуть" : "Подробнее"}
        </Button>
      </div>

      <div className={cn(s.itemsWrapper, expanded && s.itemsWrapperOpen)}>
        <div className={s.items}>
          {order.items.map(({ product: { name, id }, quantity }) => (
            <div key={id} className={s.item}>
              <span>{name}</span>
              <span>x{quantity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
