import clsx from "clsx";
import { observer } from "mobx-react-lite";

import { Button } from "@/shared/ui/Button";

import { cartM } from "../../model/cartM";
import { CartList } from "../CartList";
import { CartSidebar } from "../CartSidebar";

import s from "./CartBlock.module.scss";

export const CartBlock = observer(() => {
  const { isEmpty, isCartTransitioningToEmpty, isInitialized } = cartM;

  if (!isInitialized) {
    return (
      <div className={s.loadingState}>
        <div className={s.loader} />
      </div>
    );
  }

  return (
    <>
      {isEmpty ? (
        <div className={s.emptyState}>
          <h2>Ваша корзина пуста</h2>
          <p>Добавьте товары из каталога, чтобы оформить заказ.</p>
          <Button to="/" className={s.linkCatalog}>
            Перейти в каталог
          </Button>
        </div>
      ) : (
        <div
          className={clsx(
            s.wrap,
            isCartTransitioningToEmpty && s.emptyStateSkeleton,
          )}
        >
          <CartList />

          <CartSidebar />
        </div>
      )}
    </>
  );
});
