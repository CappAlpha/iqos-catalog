import cn from "classnames";

import { useMobileS } from "../../../../../shared/hooks/useBreakpoint";
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

        {items.map((it, i) => {
          if (it.type === "dots") {
            return (
              <li key={`dots-${i}`} className={s.dots} aria-hidden="true">
                …
              </li>
            );
          }

          const isActive = it.value === page;
          return (
            <li key={`page-${it.value}`}>
              <button
                className={cn(s.btn, isActive && s.active)}
                onClick={() => onChange(it.value)}
                aria-current={isActive ? "page" : undefined}
                aria-label={
                  isActive
                    ? `Страница ${it.value}, текущая`
                    : `Идти на страницу ${it.value}`
                }
              >
                {it.value}
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
