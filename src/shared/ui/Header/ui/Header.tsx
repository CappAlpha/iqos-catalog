import {
  BluetoothIcon,
  CartIcon,
  CatalogIcon,
  LogoIqos,
  LogoLil,
  USBIcon,
} from "@/assets/icons";
import { IS_IOS } from "@/shared/config/platform";
import { useMobile, useMobileM } from "@/shared/hooks/useBreakpoint";

import { TransitionNavLink } from "../../TransitionNavLink";
import { HeaderLink } from "./HeaderLink";

import s from "../Header.module.scss";

export interface INavLinkItem {
  to: string;
  text: string;
  Icon: IconType;
  isCart?: boolean;
}

const NAV_LINKS: INavLinkItem[] = [
  { to: "/", text: "Каталог", Icon: CatalogIcon },
  { to: "/bluetooth", text: "Bluetooth", Icon: BluetoothIcon },
  { to: "/usb", text: "USB", Icon: USBIcon },
  { to: "/cart", text: "Корзина", Icon: CartIcon, isCart: true },
];

const ALLOWED_NAV_LINKS = NAV_LINKS.filter(
  ({ to }) => !(to === "/usb" && IS_IOS),
);

export const Header = () => {
  const isMobile = useMobile();
  const isMobileM = useMobileM();

  const logoLink = (
    <TransitionNavLink key="logo-mobile" to="/" className={s.logo}>
      <LogoIqos />
      <LogoLil />
    </TransitionNavLink>
  );

  const navLinks = ALLOWED_NAV_LINKS.map((link) => (
    <HeaderLink key={link.to} {...link} />
  ));

  const isSplitLayout = !isMobile && isMobileM && !IS_IOS;
  const showLogoOutside = !isMobileM || IS_IOS;

  return (
    <header className={s.header}>
      <div className={s.container}>
        {showLogoOutside && logoLink}

        <nav className={s.nav}>
          {isSplitLayout ? (
            <>
              {navLinks.slice(0, 2)}
              {logoLink}
              {navLinks.slice(2)}
            </>
          ) : (
            navLinks
          )}
        </nav>
      </div>
    </header>
  );
};
