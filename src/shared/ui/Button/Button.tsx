import cn from "classnames";
import { type ReactNode } from "react";

import { TransitionNavLink } from "../TransitionNavLink";

import s from "./Button.module.scss";

interface ButtonProps {
  color?: "grey" | "transparent" | "outline";
  noPadding?: boolean;
  onClick?: (event?: React.MouseEvent<HTMLButtonElement> | MouseEvent) => void;
  onMouseDown?: (
    event?: React.MouseEvent<HTMLButtonElement> | MouseEvent,
  ) => void;
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  href?: string;
  to?: string;
  targetBlank?: boolean;
}

export const Button = ({
  color,
  noPadding = false,
  onClick,
  onMouseDown,
  children,
  className,
  disabled,
  loading,
  href,
  to,
  targetBlank = false,
}: ButtonProps) => {
  const styles = cn(
    s.root,
    color && s[`color_${color}`],
    noPadding && s.noPadding,
    className,
    loading && s.loading,
    disabled && s.disabled,
  );

  if (href) {
    return (
      <a
        className={styles}
        href={href}
        target={targetBlank ? "_blank" : undefined}
        rel={targetBlank ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    );
  }

  if (to) {
    return (
      <TransitionNavLink className={styles} to={to}>
        {children}
      </TransitionNavLink>
    );
  }

  return (
    <button
      className={styles}
      onClick={onClick}
      onMouseDown={onMouseDown}
      disabled={disabled || loading}
    >
      {children}
    </button>
  );
};
