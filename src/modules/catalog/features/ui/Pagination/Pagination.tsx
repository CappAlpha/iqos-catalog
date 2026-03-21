import cn from "classnames";

import { useMobileS } from "@/shared/hooks/useBreakpoint";

import { buildPagination } from "../../lib/pagination";

import s from "./Pagination.module.scss";

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export const Pagination = ({ page, totalPages, onChange }: Props) => {
  const isMobileS = useMobileS();
  const items = buildPagination(page, totalPages);

  return (
    <nav className={s.root} aria-label="Pagination">
      <ul className={s.wrap}>
        <li>
          {!isMobileS && (
            <button
              className={s.btn}
              onClick={() => onChange(page - 1)}
              disabled={page <= 1}
              aria-label="Предыдущая страница"
            >
              ←
            </button>
          )}
        </li>

        {items.map((item, i) => {
          if (item.type === "dots") {
            return (
              <li key={`dots-${i}`} className={s.dots} aria-hidden="true">
                …
              </li>
            );
          }

          const isActive = item.value === page;
          return (
            <li key={`page-${item.value}`}>
              <button
                className={cn(s.btn, isActive && s.active)}
                onClick={() => onChange(item.value)}
                aria-current={isActive ? "page" : undefined}
                aria-label={
                  isActive
                    ? `Страница ${item.value}, текущая`
                    : `Идти на страницу ${item.value}`
                }
              >
                {item.value}
              </button>
            </li>
          );
        })}

        <li>
          {!isMobileS && (
            <button
              className={s.btn}
              onClick={() => onChange(page + 1)}
              disabled={page >= totalPages}
              aria-label="Следующая страница"
            >
              →
            </button>
          )}
        </li>
      </ul>
    </nav>
  );
};
