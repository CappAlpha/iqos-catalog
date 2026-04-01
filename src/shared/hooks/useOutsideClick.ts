import { useEffect, type RefObject } from "react";

export const useOutsideClick = (
  onClickOutside: (e?: MouseEvent) => void,
  ref: RefObject<HTMLDivElement | null>,
) => {
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;

      if (target.closest(".toast-container")) {
        return;
      }

      if (ref.current && !ref.current.contains(target)) {
        onClickOutside(e);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClickOutside, ref]);
};
