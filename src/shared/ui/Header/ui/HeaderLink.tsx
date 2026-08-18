import clsx from "clsx";
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
          clsx(s.navLink, { [s.active]: isActive, [s.pending]: isPending })
        }
      >
        <div className={clsx(s.iconWrap, isCart && s.cartIconWrap)}>
          {showStatusDot && (
            <div className={s.status}>
              <span className={s.statusDot} />
            </div>
          )}
          <Icon className={s.icon} />
          {isCart && uniqueItemsCount > 0 && (
            <b
              className={clsx(s.badge, {
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
