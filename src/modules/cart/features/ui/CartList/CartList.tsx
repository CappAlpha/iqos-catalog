import { observer } from "mobx-react-lite";

import { cartM } from "../../model/cartM";
import { CartItemCard } from "../CartItemCard";

import s from "./CartList.module.scss";

export const CartList = observer(() => {
  const { items } = cartM;

  return (
    <div className={s.root}>
      {items.map((item) => (
        <CartItemCard key={item.product.id} item={item} />
      ))}
    </div>
  );
});
