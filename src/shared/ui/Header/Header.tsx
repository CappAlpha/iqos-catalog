import clsx from "clsx";

import { LogoIqos, LogoLil } from "@/assets/icons";

import { TransitionNavLink } from "../TransitionNavLink";

import s from "./Header.module.scss";

export interface IHeaderLinkItem {
  to: string;
  text: string;
  Icon: TIconType;
  isConnected?: boolean;
  badgeCount?: number;
  isBadgeUpdating?: boolean;
}

type TLogoPlacement = "outside" | "split" | "hidden";

interface IHeaderProps {
  links: IHeaderLinkItem[];
  logoTo: string;
  logoPlacement: TLogoPlacement;
  onPreloadRoute?: (to: string) => void;
}

export const Header = ({
  links,
  logoTo,
  logoPlacement,
  onPreloadRoute,
}: IHeaderProps) => {
  const logoLink = (
    <TransitionNavLink
      key="logo"
      to={logoTo}
      className={s.logo}
      onPreloadRoute={onPreloadRoute}
    >
      <LogoIqos />
      <LogoLil />
    </TransitionNavLink>
  );

  const navLinks = links.map((link) => (
    <TransitionNavLink
      key={link.to}
      to={link.to}
      onPreloadRoute={onPreloadRoute}
      className={({ isActive, isPending }) =>
        clsx(s.navLink, { [s.active]: isActive, [s.pending]: isPending })
      }
    >
      <div className={s.iconWrap}>
        {link.isConnected && (
          <div className={s.status}>
            <span className={s.statusDot} />
          </div>
        )}
        <link.Icon className={s.icon} />
        {link.badgeCount !== undefined && link.badgeCount > 0 && (
          <b
            className={clsx(s.badge, {
              [s.cartInitial]: link.badgeCount === 1,
              [s.updatingBadge]: link.badgeCount > 1 && link.isBadgeUpdating,
            })}
          >
            {link.badgeCount}
          </b>
        )}
      </div>
      <span className={s.text}>{link.text}</span>
    </TransitionNavLink>
  ));

  return (
    <header className={s.header}>
      <div className={s.container}>
        {logoPlacement === "outside" && logoLink}

        <nav className={s.nav}>
          {logoPlacement === "split" ? (
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
