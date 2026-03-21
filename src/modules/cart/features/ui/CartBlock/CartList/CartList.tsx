import type { CartItem } from "../../../model/types";
import { CartItemCard } from "../../CartItemCard";

import s from "./CartList.module.scss";

export interface Props {
  items: CartItem[];
}

export const CartList = ({ items }: Props) => {
  return (
    <div className={s.root}>
      {items.map((item) => (
        <CartItemCard key={item.product.id} item={item} />
      ))}
    </div>
  );
};
