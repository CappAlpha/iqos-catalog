import { observer } from "mobx-react-lite";

import { cartM } from "../../model/cartM";
import { HistoryCard } from "../HistoryCard";

import s from "./CartHistory.module.scss";

export const CartHistory = observer(() => {
  const { orderHistory } = cartM;

  if (orderHistory.length === 0) return null;

  return (
    <div className={s.root}>
      <h2 className={s.title}>История заказов</h2>
      <div className={s.list}>
        {orderHistory.map((order) => (
          <HistoryCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
});
