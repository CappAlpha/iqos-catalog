import cn from "classnames";
import type { ChangeEvent } from "react";

import s from "./Select.module.scss";

type SelectOption = { id: string; label: string };

interface SelectProps {
  value: string;
  onChange: (id: string, event: ChangeEvent<HTMLSelectElement>) => void;

  options: SelectOption[];
  placeholder?: string;

  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export const Select = ({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  className,
  ariaLabel,
}: SelectProps) => {
  const styles = cn(s.root, disabled && s.disabled, className);

  return (
    <div className={styles}>
      <select
        className={s.select}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value, e)}
      >
        {placeholder &&
          <option value="" disabled>
            {placeholder}
          </option>
        }

        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>

      <span className={s.chevron} aria-hidden="true" />
    </div>
  );
};
