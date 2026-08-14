import cn from "classnames";
import { observer } from "mobx-react-lite";

import { bluetoothM } from "@/modules/bluetooth/features/model/bluetoothM";
import { cartM } from "@/modules/cart/features/model/cartM";
import { usbM } from "@/modules/usb/features/model/usbM";

import { TransitionNavLink } from "../../TransitionNavLink";
import type { INavLinkItem } from "./Header";

import s from "../Header.module.scss";

export const HeaderLink = observer(
  ({ to, text, Icon, isCart }: INavLinkItem) => {
    const { status: statusBluetooth } = bluetoothM;
    const { status: statusUsb } = usbM;
    const { isCartUpdating, uniqueItemsCount } = cartM;

    const showStatusDot =
      (to === "/bluetooth" && statusBluetooth === "connected") ||
      (to === "/usb" && statusUsb === "connected");

    return (
      <TransitionNavLink
        to={to}
        className={({ isActive, isPending }) =>
          cn(s.navLink, { [s.active]: isActive, [s.pending]: isPending })
        }
      >
        <div className={cn(s.iconWrap, isCart && s.cartIconWrap)}>
          {showStatusDot && (
            <div className={s.status}>
              <span className={s.statusDot} />
            </div>
          )}
          <Icon className={s.icon} />
          {isCart && uniqueItemsCount > 0 && (
            <b
              className={cn(s.badge, {
                [s.cartInitial]: uniqueItemsCount === 1,
                [s.updatingBadge]: uniqueItemsCount > 1 && isCartUpdating,
              })}
            >
              {uniqueItemsCount}
            </b>
          )}
        </div>
        <span className={s.text}>{text}</span>
      </TransitionNavLink>
    );
  },
);
