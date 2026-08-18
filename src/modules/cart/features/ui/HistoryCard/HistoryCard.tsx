import clsx from "clsx";
import { useState } from "react";

import { formatPrice } from "@/shared/lib/formatPrice";
import { Button } from "@/shared/ui/Button";

import type { Order } from "../../model/types";

import s from "./HistoryCard.module.scss";

interface Props {
  order: Order;
  isNew?: boolean;
}

export const HistoryCard = ({ order, isNew = false }: Props) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={clsx(s.root, isNew && s.cardIntro)}>
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

      <div className={clsx(s.itemsWrapper, expanded && s.itemsWrapperOpen)}>
        <div className={s.items}>
          {order.items.map(({ product: { name, id }, quantity }) => (
            <div key={id} className={s.item}>
              <span>{name}</span>
              <span className={s.line} />
              <span>x{quantity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
