import { CartBlock } from "@/modules/cart/features/ui/CartBlock";
import { CartHeader } from "@/modules/cart/features/ui/CartHeader";
import { CartHistory } from "@/modules/cart/features/ui/CartHistory";

import s from "./CartPage.module.scss";

export const CartPage = () => {
  return (
    <div className={s.root}>
      <CartHeader />
      <CartBlock />
      <CartHistory />
    </div>
  );
};
