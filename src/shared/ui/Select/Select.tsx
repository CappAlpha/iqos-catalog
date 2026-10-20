import clsx from "clsx";
import { useState, useRef, type ReactNode } from "react";

import { useOnButtonDown } from "@/shared/hooks/useOnButtonDown";
import { useOutsideClick } from "@/shared/hooks/useOutsideClick";

import s from "./Select.module.scss";

export interface ISelectOption<T> {
  id: T;
  label: string;
}

interface ISelectProps<T> {
  value: T;
  options: ISelectOption<T>[];
  onChange: (value: T) => void;
  renderTrigger: (props: {
    selectedOption: ISelectOption<T> | undefined;
    isOpen: boolean;
    disabled: boolean;
    toggle: () => void;
  }) => ReactNode;
  disabled?: boolean;
  className?: string;
  menuClassName?: string | undefined;
  placement?: "bottom" | "top";
}

export const Select = <T extends string | number>({
  value,
  options,
  onChange,
  renderTrigger,
  disabled = false,
  className,
  menuClassName,
  placement = "bottom",
}: ISelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.id === value);

  useOutsideClick(() => setIsOpen(false), selectRef);

  useOnButtonDown("Escape", () => setIsOpen(false), !isOpen);

  const toggle = () => {
    if (!disabled) setIsOpen((open) => !open);
  };

  const handleSelect = (optionId: T) => {
    if (disabled) return;
    onChange(optionId);
    setIsOpen(false);
  };

  return (
    <div
      ref={selectRef}
      className={clsx(s.root, placement === "top" && s.openUp, className)}
    >
      {renderTrigger({ selectedOption, isOpen, disabled, toggle })}
      <ul
        className={clsx(s.options, isOpen && s.open, menuClassName)}
        role="listbox"
      >
        {options.map(({ id, label }) => (
          <li key={id}>
            <button
              type="button"
              role="option"
              aria-selected={id === value}
              disabled={disabled}
              className={clsx(s.option, id === value && s.selected)}
              onClick={() => handleSelect(id)}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
