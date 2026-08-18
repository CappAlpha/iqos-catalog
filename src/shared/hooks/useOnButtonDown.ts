import { useEffect } from "react";

export const useOnButtonDown = (
  key: KeyboardEvent["key"],
  onButtonDown: (e?: KeyboardEvent) => void,
  disabled?: boolean,
) => {
  useEffect(() => {
    if (disabled) return;

    const handleButton = (e: KeyboardEvent) => {
      if (e.key === key) onButtonDown(e);
    };

    document.addEventListener("keydown", handleButton);
    return () => document.removeEventListener("keydown", handleButton);
  }, [key, onButtonDown, disabled]);
};
