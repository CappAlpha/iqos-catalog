import { type RefObject, useEffect } from "react";

export const useOutsideClick = (
  onClickOutside: (e?: PointerEvent) => void,
  ref: RefObject<HTMLDivElement | null>,
) => {
  useEffect(() => {
    const handlePointerDownOutside = (e: PointerEvent) => {
      const target = e.target as Element;
      if (target.closest(".toast-container")) return;

      if (ref.current && !ref.current.contains(target)) {
        onClickOutside(e);
      }
    };

    document.addEventListener("pointerdown", handlePointerDownOutside);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDownOutside);
  }, [ref, onClickOutside]);
};
