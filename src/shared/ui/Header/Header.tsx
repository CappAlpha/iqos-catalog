import cn from "classnames";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";

import {
  BluetoothIcon,
  CartIcon,
  CatalogIcon,
  LogoIqos,
  LogoLil,
} from "@/assets/icons";
import { cartM } from "@/modules/cart/features/model/cartM";

import { TransitionNavLink } from "../TransitionNavLink";

import s from "./Header.module.scss";

export const Header = observer(() => {
  const { initStore, isCartUpdating, totalItems, isEmpty } = cartM;

  useEffect(() => {
    initStore();
  }, []);

  return (
    <header className={s.header}>
      <div className={s.container}>
        <TransitionNavLink to="/" className={s.logo}>
          <LogoIqos />
          <LogoLil />
        </TransitionNavLink>

        <nav className={s.nav}>
          <TransitionNavLink
            to="/"
            className={({ isActive, isPending }) =>
              cn(s.navLink, { [s.active]: isActive, [s.pending]: isPending })
            }
          >
            <CatalogIcon className={s.icon} />
            <span className={s.text}>Каталог</span>
          </TransitionNavLink>

          <TransitionNavLink
            to="/bluetooth"
            className={({ isActive, isPending }) =>
              cn(s.navLink, { [s.active]: isActive, [s.pending]: isPending })
            }
          >
            <BluetoothIcon className={s.icon} />
            <span className={s.text}>Bluetooth</span>
          </TransitionNavLink>

          <TransitionNavLink
            to="/cart"
            className={({ isActive, isPending }) =>
              cn(s.navLink, { [s.active]: isActive, [s.pending]: isPending })
            }
          >
            <div className={s.cartIconWrap}>
              <CartIcon className={s.icon} />
              {!isEmpty && (
                <b
                  className={cn(
                    s.badge,
                    totalItems === 1 && s.cartInitial,
                    totalItems > 1 && isCartUpdating && s.updatingBadge,
                  )}
                >
                  {totalItems}
                </b>
              )}
            </div>
            <span className={s.text}>Корзина</span>
          </TransitionNavLink>
        </nav>
      </div>
    </header>
  );
});
