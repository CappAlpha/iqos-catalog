import { NavLink, type NavLinkProps } from "react-router";

export interface ITransitionNavLinkProps extends NavLinkProps {
  onPreloadRoute?: (to: string) => void;
}

export const TransitionNavLink = ({
  to,
  children,
  className,
  onPreloadRoute,
  onMouseEnter,
  onTouchStart,
  ...props
}: ITransitionNavLinkProps) => {
  const handlePreload = () => {
    const target = typeof to === "string" ? to : to.pathname;
    if (target) onPreloadRoute?.(target);
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
