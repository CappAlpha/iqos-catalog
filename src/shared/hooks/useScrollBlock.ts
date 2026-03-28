import { useEffect } from "react";

export const useScrollBlock = (shouldBlock: boolean) => {
  useEffect(() => {
    if (!shouldBlock) return;

    const originalStyle = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [shouldBlock]);
};
