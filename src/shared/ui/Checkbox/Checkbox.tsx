import cn from "classnames";
import type { ChangeEvent, ReactNode } from "react";

import s from "./Checkbox.module.scss";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean, event: ChangeEvent<HTMLInputElement>) => void;

  label?: ReactNode;
  id?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
}

export const Checkbox = ({
  checked,
  onChange,
  label,
  id,
  name,
  disabled,
  className,
}: CheckboxProps) => {
  const styles = cn(s.root, disabled && s.disabled, className);

  return (
    <label className={styles}>
      <input
        className={s.input}
        id={id}
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked, e)}
        type="checkbox"
      />
      <span className={s.box} aria-hidden="true" />
      {label && <span className={s.label}>{label}</span>}
    </label>
  );
};
