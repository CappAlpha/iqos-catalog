import { NavLink, useNavigate, type NavLinkProps } from "react-router";
import { flushSync } from "react-dom";

export const TransitionNavLink = ({ to, children, onClick, className }: NavLinkProps) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    e.preventDefault();

    if (!document.startViewTransition) {
      navigate(to);
      return;
    }

    document.startViewTransition(() => {
      flushSync(() => {
        navigate(to);
      });
    });
  };

  return (
    <NavLink to={to} onClick={handleClick} className={className}>
      {children}
    </NavLink>
  );
};