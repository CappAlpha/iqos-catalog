import { useEffect, type RefObject } from "react";

export const useOutsideClick = (onClickOutside: () => void, ref: RefObject<HTMLDivElement | null>) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClickOutside();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
};