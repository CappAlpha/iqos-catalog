import { useEffect } from "react";

export const useVH = () => {
  useEffect(() => {
    if (typeof CSS !== "undefined" && CSS.supports("height: 100dvh")) return;

    let lastWidth = globalThis.innerWidth;

    const setVH = () => {
      const vh = globalThis.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    const handleResize = () => {
      const currentWidth = globalThis.innerWidth;
      if (currentWidth !== lastWidth) {
        lastWidth = currentWidth;
        setVH();
      }
    };

    setVH();
    globalThis.addEventListener("resize", handleResize);

    return () => {
      globalThis.removeEventListener("resize", handleResize);
    };
  }, []);
};
