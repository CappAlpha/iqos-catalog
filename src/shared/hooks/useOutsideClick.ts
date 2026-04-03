import { useEffect, useRef, type RefObject } from "react";

export const useOutsideClick = (
  onClickOutside: (e?: MouseEvent) => void,
  ref: RefObject<HTMLDivElement | null>,
) => {
  const callbackRef = useRef(onClickOutside);

  useEffect(() => {
    callbackRef.current = onClickOutside;
  }, [onClickOutside]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;

      if (target.closest(".toast-container")) {
        return;
      }

      if (ref.current && !ref.current.contains(target)) {
        callbackRef.current(e);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref]);
};
