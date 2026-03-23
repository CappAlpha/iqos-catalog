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

const NAV_LINKS = [
  { to: "/", text: "Каталог", Icon: CatalogIcon },
  { to: "/bluetooth", text: "Bluetooth", Icon: BluetoothIcon },
  { to: "/cart", text: "Корзина", Icon: CartIcon, isCart: true },
];

export const Header = observer(() => {
  const { initStore, isCartUpdating, totalItems, isEmpty } = cartM;

  useEffect(() => {
    initStore();
  }, [initStore]);

  return (
    <header className={s.header}>
      <div className={s.container}>
        <TransitionNavLink to="/" className={s.logo}>
          <LogoIqos />
          <LogoLil />
        </TransitionNavLink>

        <nav className={s.nav}>
          {NAV_LINKS.map(({ to, text, Icon, isCart }) => (
            <TransitionNavLink
              key={to}
              to={to}
              className={({ isActive, isPending }) =>
                cn(s.navLink, { [s.active]: isActive, [s.pending]: isPending })
              }
            >
              <div className={cn(isCart && s.cartIconWrap)}>
                <Icon className={s.icon} />
                {isCart && !isEmpty && (
                  <b
                    className={cn(s.badge, {
                      [s.cartInitial]: totalItems === 1,
                      [s.updatingBadge]: totalItems > 1 && isCartUpdating,
                    })}
                  >
                    {totalItems}
                  </b>
                )}
              </div>
              <span className={s.text}>{text}</span>
            </TransitionNavLink>
          ))}
        </nav>
      </div>
    </header>
  );
});
