import type { MouseEvent } from "react";
import { flushSync } from "react-dom";
import { NavLink, useNavigate, type NavLinkProps } from "react-router";

export const TransitionNavLink = ({
  to,
  children,
  onClick,
  className,
}: NavLinkProps) => {
  const navigate = useNavigate();

  const handleClick = async (e: MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    e.preventDefault();

    if (!document.startViewTransition) {
      await navigate(to);
      return;
    }

    document.startViewTransition(() => {
      // eslint-disable-next-line @eslint-react/dom-no-flush-sync
      flushSync(() => {
        void navigate(to);
      });
    });
  };

  return (
    // TODO: sometime add viewTransition parameter
    <NavLink to={to} onClick={handleClick} className={className}>
      {children}
    </NavLink>
  );
};
