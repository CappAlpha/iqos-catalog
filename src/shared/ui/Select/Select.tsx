import { useState, useRef, useEffect } from "react";
import cn from "classnames";
import s from "./Select.module.scss";

interface Option {
  id: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  options: Option[];
  onChange: (value: string, event?: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
}

export const Select = ({
  value,
  options,
  onChange,
  disabled = false,
  className,
}: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (optionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(optionId, e);
    setIsOpen(false);
  };

  return (
    <div
      ref={selectRef}
      className={cn(s.root, disabled && s.disabled, className)}
      role="listbox"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
    >
      <div
        className={cn(s.select, isOpen && s.open)}
        onClick={handleToggle}
        role="button"
        aria-label="Выберите опцию"
      >
        <span className={s.value}>
          {selectedOption?.label}
        </span>
        <div className={s.chevron} />
      </div>

      <div className={cn(s.options, isOpen && s.open)} role="listbox">
        {options.map((option) => (
          <div
            key={option.id}
            className={cn(s.option, option.id === value && s.selected)}
            onClick={(e) => handleSelect(option.id, e)}
            role="option"
            aria-selected={option.id === value}
            tabIndex={0}
          >
            {option.label}
          </div>
        ))}
      </div>
    </div>
  );
};