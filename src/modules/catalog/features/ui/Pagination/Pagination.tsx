import { clamp } from "../../../../../shared/lib/math";
import s from "./Pagination.module.scss";
import { useBreakpoint } from "../../../../../shared/hooks/useBreakpoint";
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
  const isMobile = useBreakpoint("mobile");
  const safePage = clamp(page, 1, totalPages);
  const items = buildPagination(safePage, totalPages);

  const go = (page: number) => onChange(clamp(page, 1, totalPages));

  return (
    <nav className={s.wrap} aria-label="Pagination">
      {!isMobile &&
        <button
          className={s.btn}
          onClick={() => go(safePage - 1)}
          disabled={safePage <= 1}
          aria-label="Previous page"
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

        const active = it.value === safePage;
        return (
          <button
            key={`page-${it.value}`}
            className={`${s.btn} ${active ? s.active : ""}`}
            onClick={() => go(it.value)}
            aria-current={active ? "page" : undefined}
            aria-label={active ? `Page ${it.value}, current` : `Go to page ${it.value}`}
          >
            {it.value}
          </button>
        );
      })}

      {!isMobile &&
        <button
          className={s.btn}
          onClick={() => go(safePage + 1)}
          disabled={safePage >= totalPages}
          aria-label="Next page"
        >
          →
        </button>
      }
    </nav>
  );
}
