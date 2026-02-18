import s from "./Pagination.module.scss";
import { useMobile } from "../../../../../shared/hooks/useBreakpoint";
import { buildPagination } from "../../lib/pagination";

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export const Pagination = ({
  page,
  totalPages,
  onChange,
}: Props) => {
  const isMobile = useMobile();
  const items = buildPagination(page, totalPages);

  return (
    <nav className={s.wrap} aria-label="Pagination">
      {!isMobile &&
        <button
          className={s.btn}
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Предыдущая страница"
        >
          ←
        </button>
      }

      {items.map((it) => {
        if (it.type === "dots") {
          return (
            <span key={`dots-${it.side}`} className={s.dots} aria-hidden="true">
              …
            </span>
          );
        }

        const active = it.value === page;
        return (
          <button
            key={`page-${it.value}`}
            className={`${s.btn} ${active ? s.active : ""}`}
            onClick={() => onChange(it.value)}
            aria-current={active ? "page" : undefined}
            aria-label={active ? `Страница ${it.value}, текущая` : `Идти на страницу ${it.value}`}
          >
            {it.value}
          </button>
        );
      })}

      {!isMobile &&
        <button
          className={s.btn}
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Следующая страница"
        >
          →
        </button>
      }
    </nav>
  );
}
