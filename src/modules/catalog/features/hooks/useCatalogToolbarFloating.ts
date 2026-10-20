import { useEffect, useRef, useState } from "react";

export const useCatalogToolbarFloating = (enabled: boolean) => {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [isFloating, setIsFloating] = useState(false);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!enabled || !anchor) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      setIsFloating(
        !entry.isIntersecting && entry.boundingClientRect.bottom <= 0,
      );
    });

    observer.observe(anchor);
    return () => observer.disconnect();
  }, [enabled]);

  return { anchorRef, isFloating: enabled && isFloating };
};
