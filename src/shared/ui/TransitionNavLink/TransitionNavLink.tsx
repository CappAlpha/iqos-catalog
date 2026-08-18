import { NavLink, type NavLinkProps } from "react-router";

export const TransitionNavLink = ({
  to,
  children,
  className,
}: NavLinkProps) => {
  return (
    <NavLink to={to} className={className} viewTransition={true}>
      {children}
    </NavLink>
  );
};
