import cn from "classnames";
import { observer } from "mobx-react-lite";

import { cartM } from "@/modules/cart/features/model/cartM";

import { TransitionNavLink } from "../../TransitionNavLink";
import type { INavLinkItem } from "./Header";

import s from "../Header.module.scss";

export const HeaderLink = observer(
  ({ to, text, Icon, isCart }: INavLinkItem) => {
    const { isCartUpdating, uniqueItemsCount, isEmpty } = cartM;

    return (
      <TransitionNavLink
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
