import cn from "classnames";
import { observer } from "mobx-react-lite";

import {
  BluetoothIcon,
  CartIcon,
  CatalogIcon,
  LogoIqos,
  LogoLil,
  USBIcon,
} from "@/assets/icons";
import { cartM } from "@/modules/cart/features/model/cartM";
import { useMobile, useMobileM } from "@/shared/hooks/useBreakpoint";
import type { IconType } from "@/shared/types/types";

import { TransitionNavLink } from "../TransitionNavLink";

import s from "./Header.module.scss";

interface NavLinkItem {
  to: string;
  text: string;
  Icon: IconType;
  isCart?: boolean;
}

const NAV_LINKS: NavLinkItem[] = [
  { to: "/", text: "Каталог", Icon: CatalogIcon },
  { to: "/bluetooth", text: "Bluetooth", Icon: BluetoothIcon },
  { to: "/usb", text: "USB", Icon: USBIcon },
  { to: "/cart", text: "Корзина", Icon: CartIcon, isCart: true },
];

export const Header = observer(() => {
  const isMobile = useMobile();
  const isMobileM = useMobileM();
  const { isCartUpdating, totalItems, isEmpty } = cartM;

  const logoLink = (
    <TransitionNavLink key="logo-mobile" to="/" className={s.logo}>
      <LogoIqos />
      <LogoLil />
    </TransitionNavLink>
  );

  const navLinks = NAV_LINKS.map(({ to, text, Icon, isCart }) => (
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
  ));

  const renderedLinks =
    !isMobile && isMobileM
      ? [...navLinks.slice(0, 2), logoLink, ...navLinks.slice(2)]
      : navLinks;

  return (
    <header className={s.header}>
      <div className={s.container}>
        {!isMobileM && logoLink}

        <nav className={s.nav}>{renderedLinks}</nav>
      </div>
    </header>
  );
});
