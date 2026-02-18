import cn from "classnames";
import type { ChangeEvent } from "react";
import type { SelectOption } from "../../../modules/catalog/features/model/types";

import s from "./Select.module.scss";

interface SelectProps {
  value: string;
  onChange: (id: string, event: ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
}

export const Select = ({
  value,
  onChange,
  options,
  disabled,
  className,
}: SelectProps) => {
  const styles = cn(s.root, disabled && s.disabled, className);

  return (
    <div className={styles}>
      <select
        className={s.select}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value, e)}
      >
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
