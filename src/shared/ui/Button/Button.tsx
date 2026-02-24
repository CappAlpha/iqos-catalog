import cn from "classnames";
import { type MouseEvent, type ReactNode } from "react";

import s from "./Button.module.scss";

interface ButtonProps {
  color?: "grey" | "transparent" | "outline";
  size?: "m" | "s" | "l";
  noPadding?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  onMouseDown?: (event: MouseEvent<HTMLButtonElement>) => void;
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  href?: string;
  targetBlank?: boolean;
}

export const Button = ({
  color,
  size = "m",
  noPadding = false,
  onClick,
  onMouseDown,
  children,
  className,
  disabled,
  loading,
  href = "",
  targetBlank = false,
}: ButtonProps) => {
  const styles = cn(
    s.root,
    color && s[`color_${color}`],
    size && s[`size_${size}`],
    noPadding && s.noPadding,
    className,
    loading && s.loading,
    disabled && s.disabled,
  );

  return href ? (
    <a className={styles} href={href} target={targetBlank ? "_blank" : ""}>
      {children}
    </a>
  ) : (
    <button className={styles} onClick={onClick} onMouseDown={onMouseDown}>
      {children}
    </button>
  );
};
