import { useEffect } from "react";

export const useVH = () => {
  useEffect(() => {
    if (typeof CSS !== "undefined" && CSS.supports("height: 1dvh")) return;

    let lastWidth = globalThis.window.innerWidth ?? 0;

    const setVH = () => {
      const vh = globalThis.window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    const handleResize = () => {
      const currentWidth = globalThis.window.innerWidth;
      if (currentWidth !== lastWidth) {
        lastWidth = currentWidth;
        setVH();
      }
    };

    setVH();
    globalThis.window.addEventListener("resize", handleResize);

    return () => {
      globalThis.window.removeEventListener("resize", handleResize);
    };
  }, []);
};
