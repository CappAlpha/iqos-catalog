import cn from "classnames";
import { useState, useRef, type MouseEvent } from "react";

import { useMobileM } from "@/shared/hooks/useBreakpoint";
import { useOnButtonDown } from "@/shared/hooks/useOnButtonDown";

import { useOutsideClick } from "../../hooks/useOutsideClick";

import s from "./Select.module.scss";

interface Option<T> {
  id: T;
  label: string;
}

interface CustomSelectProps<T> {
  value: T;
  options: Option<T>[];
  onChange: (value: T, event?: MouseEvent) => void;
  disabled?: boolean;
  className?: string;
}

export const Select = <T extends string | number>({
  value,
  options,
  onChange,
  disabled = false,
  className,
}: CustomSelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.id === value);

  useOutsideClick(() => setIsOpen(false), selectRef);

  const isMobileM = useMobileM();
  useOnButtonDown("Escape", () => setIsOpen(false), isMobileM || !isOpen);

  const handleToggle = (e: MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (optionId: T, e: MouseEvent) => {
    e.stopPropagation();
    onChange(optionId, e);
    setIsOpen(false);
  };

  return (
    <div
      ref={selectRef}
      className={cn(s.root, disabled && s.disabled, className)}
    >
      <button
        type="button"
        className={cn(s.select, isOpen && s.open)}
        onClick={handleToggle}
        disabled={disabled}
        role="listbox"
      >
        <span className={s.value}>{selectedOption?.label}</span>
        <div className={s.chevron} />
      </button>

      <div className={cn(s.options, isOpen && s.open)} role="listbox">
        {options.map(({ id, label }) => (
          <option
            key={id}
            className={cn(s.option, id === value && s.selected)}
            onClick={(e) => handleSelect(id, e)}
          >
            {label}
          </option>
        ))}
      </div>
    </div>
  );
};
