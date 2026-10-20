import clsx from "clsx";

import { ChevronDownIcon, SortIcon } from "@/assets/icons";
import { Select } from "@/shared/ui/Select";

import { SORT_OPTIONS } from "../../model/constants";
import type { TSortKey } from "../../model/types";
import { CatalogSortSkeleton } from "./CatalogSortSkeleton";

import s from "./CatalogSort.module.scss";

interface IProps {
  value: TSortKey;
  onChange: (value: TSortKey) => void;
  loading?: boolean;
  compact?: boolean;
}

export const CatalogSort = ({
  value,
  onChange,
  loading = false,
  compact = false,
}: IProps) => {
  if (loading) return <CatalogSortSkeleton />;

  return (
    <Select
      value={value}
      options={SORT_OPTIONS}
      onChange={onChange}
      placement={compact ? "top" : "bottom"}
      className={clsx(s.root, compact && s.compact)}
      menuClassName={compact ? s.compactMenu : undefined}
      renderTrigger={({ selectedOption, isOpen, toggle }) => (
        <button
          type="button"
          className={clsx(s.trigger, isOpen && s.open)}
          onClick={toggle}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={
            compact ? `Сортировка: ${selectedOption?.label ?? ""}` : undefined
          }
        >
          {compact ? (
            <SortIcon className={s.sortIcon} />
          ) : (
            <>
              <span className={s.value}>{selectedOption?.label}</span>
              <ChevronDownIcon className={s.chevron} />
            </>
          )}
        </button>
      )}
    />
  );
};
