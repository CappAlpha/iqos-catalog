import { NavLink, type NavLinkProps } from "react-router";

import { preloadRoute } from "@/shared/lib/routePreload";

export interface ITransitionNavLinkProps extends NavLinkProps {
  preload?: boolean;
}

export const TransitionNavLink = ({
  to,
  children,
  className,
  preload = true,
  onMouseEnter,
  onTouchStart,
  ...props
}: ITransitionNavLinkProps) => {
  const handlePreload = () => {
    if (!preload) {
      return;
    }

    const target = typeof to === "string" ? to : to.pathname;
    if (target) {
      preloadRoute(target);
    }
  };

  return (
    <NavLink
      to={to}
      className={className}
      viewTransition={true}
      onMouseEnter={(e) => {
        handlePreload();
        onMouseEnter?.(e);
      }}
      onTouchStart={(e) => {
        handlePreload();
        onTouchStart?.(e);
      }}
      {...props}
    >
      {children}
    </NavLink>
  );
};
