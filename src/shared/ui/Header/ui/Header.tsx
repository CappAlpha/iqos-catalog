import clsx from "clsx";

import { preloadRoute } from "@/app/routes/routeConfig";
import { LogoIqos, LogoLil } from "@/assets/icons";
import { useMobile, useMobileM } from "@/shared/hooks/useBreakpoint";

import { TransitionNavLink } from "../../TransitionNavLink";
import { UnavailableNavItem } from "./UnavailableNavItem";

import s from "../Header.module.scss";

export interface IHeaderLinkItem {
  to: string;
  text: string;
  Icon: TIconType;
  isConnected?: boolean;
  disabledReason?: string;
  badgeCount?: number;
  isBadgeUpdating?: boolean;
}

interface IHeaderProps {
  links: IHeaderLinkItem[];
  logoTo: string;
}

export const Header = ({ links, logoTo }: IHeaderProps) => {
  const isMobile = useMobile();
  const isMobileM = useMobileM();
  const logoPlacement = !isMobileM ? "outside" : isMobile ? "hidden" : "split";

  const logoLink = (
    <TransitionNavLink
      key="logo"
      to={logoTo}
      className={s.logo}
      onPreloadRoute={preloadRoute}
    >
      <LogoIqos />
      <LogoLil />
    </TransitionNavLink>
  );

  const navLinks = links.map((link) => {
    const content = (
      <>
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
      </>
    );

    if (link.disabledReason) {
      const tooltipId = `header-tooltip-${link.text.toLowerCase()}`;

      return (
        <UnavailableNavItem
          key={link.to}
          reason={link.disabledReason}
          tooltipId={tooltipId}
        >
          {content}
        </UnavailableNavItem>
      );
    }

    return (
      <TransitionNavLink
        key={link.to}
        to={link.to}
        onPreloadRoute={preloadRoute}
        className={({ isActive, isPending }) =>
          clsx(s.navLink, { [s.active]: isActive, [s.pending]: isPending })
        }
      >
        {content}
      </TransitionNavLink>
    );
  });

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
